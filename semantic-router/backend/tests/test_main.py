import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from backend.main import app
from backend.database import get_db, Base
import os
from datetime import datetime

# Use a separate test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    for ext in ["", "-shm", "-wal"]:
        path = f"./test.db{ext}"
        if os.path.exists(path):
            os.remove(path)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

# --- LLM Tests ---

def test_llm_lifecycle():
    # Create
    create_resp = client.post(
        "/api/llm",
        json={"name": "GPT-4", "url": "https://api.openai.com", "timeout": 30}
    )
    assert create_resp.status_code == 201
    llm_id = create_resp.json()["id"]

    # Get
    get_resp = client.get(f"/api/llm/{llm_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "GPT-4"

    # List
    list_resp = client.get("/api/llm")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # Update
    update_resp = client.put(f"/api/llm/{llm_id}", json={"name": "GPT-4o"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "GPT-4o"

    # Delete
    del_resp = client.delete(f"/api/llm/{llm_id}")
    assert del_resp.status_code == 204
    assert client.get(f"/api/llm/{llm_id}").status_code == 404

# --- Route Tests ---

def test_route_lifecycle():
    # Setup LLM
    llm_id = client.post("/api/llm", json={"name": "L", "url": "U"}).json()["id"]

    # Create Route
    create_resp = client.post("/api/route", json={"name": "Chat", "llm": llm_id})
    assert create_resp.status_code == 201
    route_id = create_resp.json()["id"]

    # Get Route
    assert client.get(f"/api/route/{route_id}").json()["name"] == "Chat"

    # Update Route
    client.put(f"/api/route/{route_id}", json={"name": "Support"})
    assert client.get(f"/api/route/{route_id}").json()["name"] == "Support"

    # Delete Route
    assert client.delete(f"/api/route/{route_id}").status_code == 204
    assert client.get(f"/api/route/{route_id}").status_code == 404

# --- Utterance Tests ---

def test_utterance_lifecycle():
    # Setup
    llm_id = client.post("/api/llm", json={"name": "L", "url": "U"}).json()["id"]
    route_id = client.post("/api/route", json={"name": "R", "llm": llm_id}).json()["id"]

    # Create Utterance
    utt_resp = client.post(f"/api/route/{route_id}/utterance", json={"utterance": "hello"})
    assert utt_resp.status_code == 201
    utt_id = utt_resp.json()["id"]

    # List Utterances
    list_resp = client.get(f"/api/route/{route_id}/utterance")
    assert len(list_resp.json()) == 1

    # Get Utterance
    get_resp = client.get(f"/api/route/{route_id}/utterance/{utt_id}")
    assert get_resp.json()["utterance"] == "hello"

    # Update Utterance
    client.put(f"/api/route/{route_id}/utterance/{utt_id}", json={"utterance": "hi"})
    assert client.get(f"/api/route/{route_id}/utterance/{utt_id}").json()["utterance"] == "hi"

    # Delete Utterance
    assert client.delete(f"/api/route/{route_id}/utterance/{utt_id}").status_code == 204

# --- Config Tests ---

def test_config_operations():
    # Default config is created on first GET
    get_resp = client.get("/api/config")
    assert get_resp.status_code == 200
    
    # Update config
    update_resp = client.put("/api/config", json={"log_level": "all"})
    assert update_resp.json()["log_level"] == "all"

# --- Log Tests ---

def test_log_operations():
    # We don't have a POST for logs as they are likely generated internally,
    # but we can test the list and delete if we manually insert one via DB or if there was an endpoint.
    # Since there's no POST /api/log, I'll assume they exist or verify empty list.
    assert len(client.get("/api/log").json()) == 0
