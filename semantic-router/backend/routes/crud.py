import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud
from ..crud.exceptions import IntegrityViolationError
from ..database import get_db
from ..router_manager import router_manager

router = APIRouter()

# --- LLM Endpoints ---


@router.get("/llm", response_model=List[schemas.LLM])
def get_llms(db: Session = Depends(get_db)):
    return crud.llm.get_multi(db)


@router.post("/llm/models")
async def fetch_llm_models(request: schemas.LLMModelsRequest):
    base_url = request.url
    if base_url.endswith("/chat/completions"):
        base_url = base_url[:-17] + "/models"
    elif not base_url.endswith("/models"):
        if base_url.endswith("/"):
            base_url += "v1/models"
        else:
            base_url += "/v1/models"

    headers = {}
    if request.secret:
        headers["Authorization"] = f"Bearer {request.secret}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if "data" in data and isinstance(data["data"], list):
                return [m.get("id") for m in data["data"] if "id" in m]
            return []
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch models: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/llm", response_model=schemas.LLM, status_code=status.HTTP_201_CREATED)
def create_llm(llm_in: schemas.LLMCreate, db: Session = Depends(get_db)):
    return crud.llm.create(db, obj_in=llm_in)


@router.get("/llm/{id}", response_model=schemas.LLM)
def get_llm(id: int, db: Session = Depends(get_db)):
    db_llm = crud.llm.get(db, id=id)
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return db_llm


@router.put("/llm/{id}", response_model=schemas.LLM)
def update_llm(id: int, llm_in: schemas.LLMUpdate, db: Session = Depends(get_db)):
    db_llm = crud.llm.get(db, id=id)
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return crud.llm.update(db, db_obj=db_llm, obj_in=llm_in)


@router.delete("/llm/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_llm(id: int, db: Session = Depends(get_db)):
    try:
        db_llm = crud.llm.remove(db, id=id)
    except IntegrityViolationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return None


# --- Route Endpoints ---


@router.get("/route", response_model=List[schemas.Route])
def get_routes(db: Session = Depends(get_db)):
    return crud.route.get_multi(db)


@router.post(
    "/route", response_model=schemas.Route, status_code=status.HTTP_201_CREATED
)
def create_route(route_in: schemas.RouteCreate, db: Session = Depends(get_db)):
    route = crud.route.create(db, obj_in=route_in)
    router_manager.refresh(db)
    return route


@router.get("/route/{id}", response_model=schemas.Route)
def get_route(id: int, db: Session = Depends(get_db)):
    db_route = crud.route.get(db, id=id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    return db_route


@router.put("/route/{id}", response_model=schemas.Route)
def update_route(id: int, route_in: schemas.RouteUpdate, db: Session = Depends(get_db)):
    db_route = crud.route.get(db, id=id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    updated_route = crud.route.update(db, db_obj=db_route, obj_in=route_in)
    router_manager.refresh(db)
    return updated_route


@router.delete("/route/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(id: int, db: Session = Depends(get_db)):
    db_route = crud.route.remove(db, id=id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    router_manager.refresh(db)
    return None


# --- Utterance Endpoints ---


@router.get("/route/{id}/utterance", response_model=List[schemas.RouteUtterance])
def get_route_utterances(id: int, db: Session = Depends(get_db)):
    return crud.utterance.get_by_route(db, route_id=id)


@router.post(
    "/route/{id}/utterance",
    response_model=schemas.RouteUtterance,
    status_code=status.HTTP_201_CREATED,
)
def create_route_utterance(
    id: int, utterance_in: schemas.RouteUtteranceCreate, db: Session = Depends(get_db)
):
    db_route = crud.route.get(db, id=id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    utt = crud.utterance.create(db, obj_in=utterance_in.model_dump() | {"route_id": id})
    router_manager.refresh(db)
    return utt


@router.get(
    "/route/{route_id}/utterance/{utterance_id}", response_model=schemas.RouteUtterance
)
def get_utterance(route_id: int, utterance_id: int, db: Session = Depends(get_db)):
    db_utterance = crud.utterance.get_by_route_and_id(
        db, route_id=route_id, id=utterance_id
    )
    if not db_utterance:
        raise HTTPException(status_code=404, detail="Utterance not found")
    return db_utterance


@router.put(
    "/route/{route_id}/utterance/{utterance_id}", response_model=schemas.RouteUtterance
)
def update_utterance(
    route_id: int,
    utterance_id: int,
    utterance_in: schemas.RouteUtteranceUpdate,
    db: Session = Depends(get_db),
):
    db_utterance = crud.utterance.get_by_route_and_id(
        db, route_id=route_id, id=utterance_id
    )
    if not db_utterance:
        raise HTTPException(status_code=404, detail="Utterance not found")
    updated_utt = crud.utterance.update(db, db_obj=db_utterance, obj_in=utterance_in)
    router_manager.refresh(db)
    return updated_utt


@router.delete(
    "/route/{route_id}/utterance/{utterance_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_utterance(route_id: int, utterance_id: int, db: Session = Depends(get_db)):
    db_utterance = crud.utterance.get_by_route_and_id(
        db, route_id=route_id, id=utterance_id
    )
    if not db_utterance:
        raise HTTPException(status_code=404, detail="Utterance not found")
    crud.utterance.remove(db, id=utterance_id)
    router_manager.refresh(db)
    return None


# --- Config Endpoints ---


@router.get("/config", response_model=schemas.ConfigSchema)
def get_config(db: Session = Depends(get_db)):
    return crud.config.get_config(db)


@router.put("/config", response_model=schemas.ConfigSchema)
def update_config(config_in: schemas.ConfigUpdate, db: Session = Depends(get_db)):
    db_config = crud.config.get_config(db)
    return crud.config.update(db, db_obj=db_config, obj_in=config_in)


# --- Log Endpoints ---


@router.get("/log", response_model=List[schemas.Log])
def get_logs(db: Session = Depends(get_db)):
    return crud.log.get_multi(db)


@router.delete("/log/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(id: str, db: Session = Depends(get_db)):
    db_log = crud.log.remove(db, id=id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return None


@router.get("/health")
def health_check():
    return {"status": "ok"}
