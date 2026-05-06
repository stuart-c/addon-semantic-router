import httpx
import logging
import time
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
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
    request_timestamp = datetime.utcnow()
    query_text = request.messages[-1].content if request.messages else ""

    # Metadata for logging
    route_id = None
    llm_id = None
    llm_name = None
    is_fallback = False
    error_msg = None
    resp_data = None

    def _do_log(l_id, r_id, r_data, e_msg, s_time, is_fb):
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
                log_entry = schemas.LogCreate(
                    id=str(uuid.uuid4()),
                    timestamp=request_timestamp,
                    duration=duration,
                    route=r_id,
                    query=query_text,
                    request=request.model_dump_json(),
                    response=json.dumps(r_data) if r_data else "",
                    failure_reason=e_msg,
                    llm=l_id,
                    original_id=r_data.get("id") if r_data else None,
                )
                crud.log.create(db, obj_in=log_entry)
        except Exception as le:
            logger.error(f"Failed to process database logging: {le}")

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
        _do_log(llm_id, route_id, resp_data, error_msg, start_time, is_fallback)


async def _call_llm(
    client: httpx.AsyncClient, llm: models.LLM, request: schemas.ChatCompletionRequest
):
    """Helper to call an LLM with its specific configuration."""
    headers = {}
    if llm.secret:
        headers["Authorization"] = f"Bearer {llm.secret}"

    # Convert request to dict, ensuring we exclude None values
    payload = request.model_dump(exclude_none=True)

    # Override the model if configured for this LLM
    if llm.model:
        payload["model"] = llm.model

    response = await client.post(
        llm.url,
        json=payload,
        headers=headers,
        timeout=llm.timeout or 30.0,
    )
    return response
