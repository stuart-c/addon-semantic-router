import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
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
    # Extract the last message content as the query
    query_text = request.messages[-1].content if request.messages else ""

    # 1. Determine the route
    route_name = router_manager.get_route_name(query_text)

    # 2. Find the target LLM
    target_llm = None
    if route_name:
        db_route = (
            db.query(models.Route).filter(models.Route.name == route_name).first()
        )
        if db_route and db_route.llm_rel:
            target_llm = db_route.llm_rel

    # 3. Get fallback LLM from config
    db_config = crud.config.get_config(db)
    fallback_llm = db_config.llm_rel if db_config else None

    # If no route match, use fallback
    if not target_llm:
        target_llm = fallback_llm
        route_name = "fallback"

    if not target_llm:
        raise HTTPException(
            status_code=500, detail="No LLM configured for routing or fallback"
        )

    # 4. Perform the call
    async with httpx.AsyncClient() as client:
        try:
            response = await _call_llm(client, target_llm, request)
            response.raise_for_status()
            llm_name = target_llm.name
        except (httpx.HTTPStatusError, httpx.RequestError, Exception) as e:
            logger.warning(
                f"Target LLM {target_llm.name} failed: {e}. Trying fallback."
            )

            # If target was already fallback, we can't fallback further
            if target_llm == fallback_llm:
                if isinstance(e, httpx.HTTPStatusError):
                    return schemas.ChatCompletionResponse(
                        **e.response.json()
                    )  # Return the error response if it's OpenAI compatible
                raise HTTPException(
                    status_code=502, detail=f"LLM call failed: {str(e)}"
                )

            if not fallback_llm:
                raise HTTPException(
                    status_code=502,
                    detail=f"Target LLM failed and no fallback configured: {str(e)}",
                )

            # Try fallback
            try:
                response = await _call_llm(client, fallback_llm, request)
                response.raise_for_status()
                llm_name = fallback_llm.name
                route_name = f"{route_name} (fallback)"
            except Exception as fe:
                logger.error(f"Fallback LLM {fallback_llm.name} also failed: {fe}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Both target and fallback LLMs failed: {str(fe)}",
                )

    # 5. Return response
    resp_data = response.json()
    return schemas.ChatCompletionResponse(**resp_data, route=route_name, llm=llm_name)


async def _call_llm(
    client: httpx.AsyncClient, llm: models.LLM, request: schemas.ChatCompletionRequest
):
    """Helper to call an LLM with its specific configuration."""
    headers = {}
    if llm.secret:
        headers["Authorization"] = f"Bearer {llm.secret}"

    # Convert request to dict, ensuring we exclude None values
    payload = request.model_dump(exclude_none=True)

    # Override model if specified in LLM config
    if llm.model:
        payload["model"] = llm.model

    timeout = llm.timeout if llm.timeout else 30

    return await client.post(
        llm.url, json=payload, headers=headers, timeout=float(timeout)
    )
