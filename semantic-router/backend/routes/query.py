import httpx
import logging
import time
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models, crud
from ..router_manager import router_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=schemas.ChatCompletionResponse)
async def semantic_query(
    request: schemas.ChatCompletionRequest, db: Session = Depends(get_db)
):
    start_time = time.time()
    query_text = request.messages[-1].content if request.messages else ""

    # Metadata for logging
    route_id = None
    llm_id = None
    llm_name = None
    is_fallback = False
    error_msg = None
    resp_data = None

    def _do_log(l_id, r_id, r_data, e_msg, s_time, is_fb):
        _do_log_helper(db, l_id, r_id, r_data, e_msg, s_time, is_fb, query_text)

    try:
        # 1. Determine the route
        route_match_name = router_manager.get_route_name(query_text)

        # 2. Find the target LLM
        target_llm = None
        route_name = "default"
        if route_match_name:
            db_route = (
                db.query(models.Route)
                .filter(models.Route.name == route_match_name)
                .first()
            )
            if db_route:
                route_id = db_route.id
                route_name = db_route.name
                if db_route.llm_rel:
                    target_llm = db_route.llm_rel
            else:
                route_name = route_match_name

        # 3. Get fallback LLM from config
        db_config = crud.config.get_config(db)
        fallback_llm = db_config.llm_rel if db_config else None

        # If no route match, use fallback
        if not target_llm:
            is_fallback = True
            target_llm = fallback_llm
            route_name = "fallback"

        if not target_llm:
            error_msg = "No LLM configured for routing or fallback"
            raise HTTPException(status_code=500, detail=error_msg)

        llm_id = target_llm.id
        llm_name = target_llm.name

        # 4. Perform the call
        async with httpx.AsyncClient() as client:
            try:
                try:
                    if request.stream:
                        return StreamingResponse(
                            _stream_generator(
                                client,
                                target_llm,
                                request,
                                route_name,
                                llm_name,
                                start_time,
                                route_id,
                                llm_id,
                                db,
                            ),
                            media_type="text/event-stream",
                        )
                    response = await _call_llm(client, target_llm, request)
                    response.raise_for_status()
                    resp_data = response.json()
                    return schemas.ChatCompletionResponse(
                        **resp_data, route=route_name, llm=llm_name
                    )
                except Exception as e:
                    # If we can fallback, log this first failure now
                    if target_llm != fallback_llm and fallback_llm:
                        _do_log(llm_id, route_id, None, str(e), start_time, is_fallback)
                        # Reset for fallback attempt
                        start_time = time.time()
                    raise e
            except (httpx.HTTPStatusError, httpx.RequestError, Exception) as e:
                logger.warning(f"LLM attempt failed: {e}")

                # If target was already fallback, we can't fallback further
                if target_llm == fallback_llm or not fallback_llm:
                    if isinstance(e, httpx.HTTPStatusError):
                        resp_data = e.response.json()
                        if isinstance(resp_data, dict):
                            resp_data["route"] = route_name
                            resp_data["llm"] = llm_name
                        error_msg = f"Status {e.response.status_code}"
                        return JSONResponse(
                            status_code=e.response.status_code, content=resp_data
                        )
                    error_msg = str(e)
                    if isinstance(e, HTTPException):
                        raise e
                    raise HTTPException(
                        status_code=502, detail=f"LLM call failed: {error_msg}"
                    )

                # Try fallback
                is_fallback = True
                target_llm = fallback_llm
                llm_id = target_llm.id
                llm_name = target_llm.name
                route_name = f"{route_name} (fallback)"
                try:
                    if request.stream:
                        return StreamingResponse(
                            _stream_generator(
                                client,
                                fallback_llm,
                                request,
                                route_name,
                                llm_name,
                                start_time,
                                route_id,
                                llm_id,
                                db,
                            ),
                            media_type="text/event-stream",
                        )
                    response = await _call_llm(client, fallback_llm, request)
                    response.raise_for_status()
                    resp_data = response.json()
                    return schemas.ChatCompletionResponse(
                        **resp_data, route=route_name, llm=llm_name
                    )
                except Exception as fe:
                    error_msg = f"Both failed: {str(fe)}"
                    logger.error(f"Fallback LLM {fallback_llm.name} also failed: {fe}")
                    if isinstance(fe, httpx.HTTPStatusError):
                        resp_data = fe.response.json()
                        if isinstance(resp_data, dict):
                            resp_data["route"] = route_name
                            resp_data["llm"] = llm_name
                        return JSONResponse(
                            status_code=fe.response.status_code, content=resp_data
                        )
                    raise HTTPException(status_code=502, detail=error_msg)

    except HTTPException as he:
        error_msg = he.detail
        raise he
    except Exception as ex:
        error_msg = str(ex)
        raise ex
    finally:
        # Log the final attempt (success, fallback success, or final failure)
        # For streams, logging is handled inside the generator.
        if (not request.stream) or (error_msg is not None):
            _do_log(llm_id, route_id, resp_data, error_msg, start_time, is_fallback)


async def _stream_generator(
    client,
    llm,
    request,
    route_name,
    llm_name,
    start_time,
    route_id,
    llm_id,
    db,
):
    accumulated_content = ""
    error_msg = None
    resp_id = None
    created = int(time.time())
    model = llm.model

    try:
        # Preparation similar to _call_llm
        model_to_use = llm.model.strip() if llm.model else None
        if model_to_use:
            request.model = model_to_use

        headers = {}
        if llm.secret:
            headers["Authorization"] = f"Bearer {llm.secret}"

        payload = request.model_dump(exclude_none=True)
        url = llm.url
        if "{model}" in url and request.model:
            url = url.replace("{model}", request.model)

        async with client.stream(
            "POST",
            url,
            json=payload,
            headers=headers,
            timeout=llm.timeout or 30.0,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue

                # Forward the line as is if it's SSE
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        yield line + "\n\n"
                        continue

                    try:
                        chunk_data = json.loads(data_str)
                        # Enrich chunk with our metadata if possible
                        if isinstance(chunk_data, dict):
                            chunk_data["route"] = route_name
                            chunk_data["llm"] = llm_name
                            if not resp_id:
                                resp_id = chunk_data.get("id")

                            # Accumulate content for logging
                            choices = chunk_data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                if "content" in delta:
                                    accumulated_content += delta["content"]

                        yield f"data: {json.dumps(chunk_data)}\n\n"
                    except json.JSONDecodeError:
                        yield line + "\n\n"
                else:
                    yield line + "\n\n"

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Streaming error: {e}")
        # We can't really change the status code here as it's already sent
        # but we can send an error chunk if we want to be nice
        err_payload = {"error": {"message": error_msg, "type": "stream_error"}}
        yield f"data: {json.dumps(err_payload)}\n\n"
        yield "data: [DONE]\n\n"
    finally:
        # Log the streamed response
        # Construct a response object compatible with what _do_log expects
        final_resp_data = {
            "id": resp_id,
            "object": "chat.completion",
            "created": created,
            "model": model,
            "choices": [
                {
                    "message": {"role": "assistant", "content": accumulated_content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "route": route_name,
            "llm": llm_name,
        }

        # Log the streamed response. We use a helper because _do_log is local.
        _do_log_helper(
            db,
            llm_id,
            route_id,
            final_resp_data,
            error_msg,
            start_time,
            "fallback" in route_name,
            request.messages[-1].content if request.messages else "Streamed Query",
        )


def _do_log_helper(
    db, l_id, r_id, r_data, e_msg, s_time, is_fb, query_text_override=None
):
    try:
        duration = time.time() - s_time
        db_config = crud.config.get_config(db)
        log_level = db_config.log_level if db_config else models.LogLevel.default

        should_log = False
        if log_level == models.LogLevel.all:
            should_log = True
        elif log_level == models.LogLevel.default:
            if is_fb or e_msg:
                should_log = True
        elif log_level == models.LogLevel.error:
            if e_msg:
                should_log = True

        if should_log:
            # We need the query text. This is a bit annoying to pass around.
            # I'll just use what's in r_data or pass it.
            log_entry = schemas.LogCreate(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),  # Approximate
                duration=duration,
                route=r_id,
                query=query_text_override or "Streamed Query",
                request="{}",  # We don't have the original request here easily
                response=json.dumps(r_data) if r_data else "",
                failure_reason=e_msg,
                llm=l_id,
                original_id=r_data.get("id") if r_data else None,
            )
            crud.log.create(db, obj_in=log_entry)
    except Exception as le:
        logger.error(f"Failed to process database logging: {le}")


async def _call_llm(
    client: httpx.AsyncClient, llm: models.LLM, request: schemas.ChatCompletionRequest
):
    """Helper to call an LLM with its specific configuration."""
    model_to_use = llm.model.strip() if llm.model else None

    # Set or override the model if configured for this LLM
    if model_to_use:
        if request.model and request.model != model_to_use:
            logger.info(
                f"Overriding request model '{request.model}' with '{model_to_use}'"
            )
        request.model = model_to_use

    headers = {}
    if llm.secret:
        headers["Authorization"] = f"Bearer {llm.secret}"

    # Convert request to dict, ensuring we exclude None values
    payload = request.model_dump(exclude_none=True)

    # Support {model} placeholder in URL
    url = llm.url
    if "{model}" in url and request.model:
        url = url.replace("{model}", request.model)

    logger.debug(
        f"Calling LLM {llm.name} at {url} with payload model: {payload.get('model')}"
    )

    response = await client.post(
        url,
        json=payload,
        headers=headers,
        timeout=llm.timeout or 30.0,
    )
    return response


@router.post("/api/test/resolve", response_model=schemas.ResolveResponse)
async def resolve_prompt(request: schemas.ResolveRequest):
    """Resolve a prompt to a route without calling an LLM."""
    result = router_manager.resolve(request.prompt)
    if result:
        return schemas.ResolveResponse(
            name=result.name, score=result.similarity_score or 0.0
        )
    return schemas.ResolveResponse(name=None, score=0.0)
