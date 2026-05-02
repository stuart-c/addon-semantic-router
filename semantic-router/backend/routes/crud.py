from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


# --- LLM Endpoints ---


@router.get("/llm", response_model=List[schemas.LLM])
def get_llms(db: Session = Depends(get_db)):
    return db.query(models.LLM).all()


@router.post("/llm", response_model=schemas.LLM, status_code=status.HTTP_201_CREATED)
def create_llm(llm: schemas.LLMCreate, db: Session = Depends(get_db)):
    db_llm = models.LLM(**llm.model_dump())
    db.add(db_llm)
    db.commit()
    db.refresh(db_llm)
    return db_llm


@router.get("/llm/{id}", response_model=schemas.LLM)
def get_llm(id: int, db: Session = Depends(get_db)):
    db_llm = db.query(models.LLM).filter(models.LLM.id == id).first()
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return db_llm


@router.put("/llm/{id}", response_model=schemas.LLM)
def update_llm(id: int, llm: schemas.LLMUpdate, db: Session = Depends(get_db)):
    db_llm = db.query(models.LLM).filter(models.LLM.id == id).first()
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")

    update_data = llm.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_llm, key, value)

    db.commit()
    db.refresh(db_llm)
    return db_llm


@router.delete("/llm/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_llm(id: int, db: Session = Depends(get_db)):
    db_llm = db.query(models.LLM).filter(models.LLM.id == id).first()
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    db.delete(db_llm)
    db.commit()
    return None


# --- Route Endpoints ---


@router.get("/route", response_model=List[schemas.Route])
def get_routes(db: Session = Depends(get_db)):
    return db.query(models.Route).all()


@router.post(
    "/route", response_model=schemas.Route, status_code=status.HTTP_201_CREATED
)
def create_route(route: schemas.RouteCreate, db: Session = Depends(get_db)):
    db_route = models.Route(**route.model_dump())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.get("/route/{id}", response_model=schemas.Route)
def get_route(id: int, db: Session = Depends(get_db)):
    db_route = db.query(models.Route).filter(models.Route.id == id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    return db_route


@router.put("/route/{id}", response_model=schemas.Route)
def update_route(id: int, route: schemas.RouteUpdate, db: Session = Depends(get_db)):
    db_route = db.query(models.Route).filter(models.Route.id == id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")

    update_data = route.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_route, key, value)

    db.commit()
    db.refresh(db_route)
    return db_route


@router.delete("/route/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(id: int, db: Session = Depends(get_db)):
    db_route = db.query(models.Route).filter(models.Route.id == id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    db.delete(db_route)
    db.commit()
    return None


# --- Utterance Endpoints ---


@router.get("/route/{id}/utterance", response_model=List[schemas.RouteUtterance])
def get_route_utterances(id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.RouteUtterance)
        .filter(models.RouteUtterance.route_id == id)
        .all()
    )


@router.post(
    "/route/{id}/utterance",
    response_model=schemas.RouteUtterance,
    status_code=status.HTTP_201_CREATED,
)
def create_route_utterance(
    id: int, utterance: schemas.RouteUtteranceCreate, db: Session = Depends(get_db)
):
    db_route = db.query(models.Route).filter(models.Route.id == id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")

    db_utterance = models.RouteUtterance(**utterance.model_dump(), route_id=id)
    db.add(db_utterance)
    db.commit()
    db.refresh(db_utterance)
    return db_utterance


@router.get(
    "/route/{route_id}/utterance/{utterance_id}", response_model=schemas.RouteUtterance
)
def get_utterance(route_id: int, utterance_id: int, db: Session = Depends(get_db)):
    db_utterance = (
        db.query(models.RouteUtterance)
        .filter(
            models.RouteUtterance.id == utterance_id,
            models.RouteUtterance.route_id == route_id,
        )
        .first()
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
    utterance: schemas.RouteUtteranceUpdate,
    db: Session = Depends(get_db),
):
    db_utterance = (
        db.query(models.RouteUtterance)
        .filter(
            models.RouteUtterance.id == utterance_id,
            models.RouteUtterance.route_id == route_id,
        )
        .first()
    )
    if not db_utterance:
        raise HTTPException(status_code=404, detail="Utterance not found")

    update_data = utterance.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_utterance, key, value)

    db.commit()
    db.refresh(db_utterance)
    return db_utterance


@router.delete(
    "/route/{route_id}/utterance/{utterance_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_utterance(route_id: int, utterance_id: int, db: Session = Depends(get_db)):
    db_utterance = (
        db.query(models.RouteUtterance)
        .filter(
            models.RouteUtterance.id == utterance_id,
            models.RouteUtterance.route_id == route_id,
        )
        .first()
    )
    if not db_utterance:
        raise HTTPException(status_code=404, detail="Utterance not found")
    db.delete(db_utterance)
    db.commit()
    return None


# --- Config Endpoints ---


@router.get("/config", response_model=schemas.ConfigSchema)
def get_config(db: Session = Depends(get_db)):
    db_config = db.query(models.Config).first()
    if not db_config:
        # Create a default config if it doesn't exist
        db_config = models.Config(log_level=models.LogLevel.default)
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
    return db_config


@router.put("/config", response_model=schemas.ConfigSchema)
def update_config(config: schemas.ConfigUpdate, db: Session = Depends(get_db)):
    db_config = db.query(models.Config).first()
    if not db_config:
        db_config = models.Config(log_level=models.LogLevel.default)
        db.add(db_config)

    update_data = config.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)

    db.commit()
    db.refresh(db_config)
    return db_config


# --- Log Endpoints ---


@router.get("/log", response_model=List[schemas.Log])
def get_logs(db: Session = Depends(get_db)):
    return db.query(models.Log).all()


@router.delete("/log/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(id: str, db: Session = Depends(get_db)):
    db_log = db.query(models.Log).filter(models.Log.id == id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(db_log)
    db.commit()
    return None
