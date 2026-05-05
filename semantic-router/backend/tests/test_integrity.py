import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db
from backend.models import Base, RouteUtterance
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use a separate test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integrity.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
    if os.path.exists("./test_integrity.db"):
        os.remove("./test_integrity.db")


def test_delete_route_cascades_utterances(setup_database):
    client = setup_database
    # 1. Create LLM
    llm_resp = client.post("/api/llm", json={"name": "L", "url": "U"})
    llm_id = llm_resp.json()["id"]

    # 2. Create Route
    route_resp = client.post("/api/route", json={"name": "R", "llm": llm_id})
    route_id = route_resp.json()["id"]

    # 3. Create Utterances
    client.post(f"/api/route/{route_id}/utterance", json={"utterance": "u1"})
    client.post(f"/api/route/{route_id}/utterance", json={"utterance": "u2"})

    # Verify utterances exist
    db = TestingSessionLocal()
    try:
        utts = (
            db.query(RouteUtterance).filter(RouteUtterance.route_id == route_id).all()
        )
        assert len(utts) == 2
    finally:
        db.close()

    # 4. Delete Route
    client.delete(f"/api/route/{route_id}")

    # Verify utterances are gone
    db = TestingSessionLocal()
    try:
        utts = (
            db.query(RouteUtterance).filter(RouteUtterance.route_id == route_id).all()
        )
        assert len(utts) == 0
    finally:
        db.close()


def test_delete_llm_in_use_by_route_fails(setup_database):
    client = setup_database
    # 1. Create LLM
    llm_resp = client.post("/api/llm", json={"name": "L", "url": "U"})
    llm_id = llm_resp.json()["id"]

    # 2. Create Route using LLM
    client.post("/api/route", json={"name": "R", "llm": llm_id})

    # 3. Try to delete LLM
    del_resp = client.delete(f"/api/llm/{llm_id}")
    assert del_resp.status_code == 400
    assert "in use by one or more routes" in del_resp.json()["detail"]


def test_delete_llm_in_use_by_config_fails(setup_database):
    client = setup_database
    # 1. Create LLM
    llm_resp = client.post("/api/llm", json={"name": "L", "url": "U"})
    llm_id = llm_resp.json()["id"]

    # 2. Set as default LLM
    client.put("/api/config", json={"default_llm": llm_id})

    # 3. Try to delete LLM
    del_resp = client.delete(f"/api/llm/{llm_id}")
    assert del_resp.status_code == 400
    assert "in use as the default LLM" in del_resp.json()["detail"]


def test_delete_unused_llm_succeeds(setup_database):
    client = setup_database
    # 1. Create LLM
    llm_resp = client.post("/api/llm", json={"name": "L", "url": "U"})
    llm_id = llm_resp.json()["id"]

    # 2. Delete LLM
    del_resp = client.delete(f"/api/llm/{llm_id}")
    assert del_resp.status_code == 204
