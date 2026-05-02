import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from backend.main import app
from backend.database import get_db
from backend.models import Base
from backend import models
from datetime import datetime
from unittest.mock import patch
import os

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


class ClientProxy:
    def __getattr__(self, name):
        return getattr(current_client, name)


client = ClientProxy()
current_client = None


@pytest.fixture(autouse=True)
def setup_database():
    global current_client
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        current_client = c
        yield c
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
        json={"name": "GPT-4", "url": "https://api.openai.com", "timeout": 30},
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


def test_llm_secret_masking():
    # Create with secret
    create_resp = client.post(
        "/api/llm",
        json={
            "name": "Secret LLM",
            "url": "https://api.openai.com",
            "secret": "my-secret-key",
        },
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["secret"] == "***"
    llm_id = create_resp.json()["id"]

    # Get should show masked secret
    get_resp = client.get(f"/api/llm/{llm_id}")
    assert get_resp.json()["secret"] == "***"

    # Update with invalid secret should fail
    update_fail = client.put(f"/api/llm/{llm_id}", json={"secret": "***"})
    assert update_fail.status_code == 422
    assert "Secret cannot be '***'" in update_fail.text

    # Update with new secret should work and show masked
    update_resp = client.put(f"/api/llm/{llm_id}", json={"secret": "new-key"})
    assert update_resp.status_code == 200
    assert update_resp.json()["secret"] == "***"

    # Create with empty secret should show empty string
    create_empty = client.post(
        "/api/llm",
        json={"name": "No Secret", "url": "U", "secret": ""},
    )
    assert create_empty.json()["secret"] == ""


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

    # List Routes
    assert len(client.get("/api/route").json()) == 1

    # Update Route
    client.put(f"/api/route/{route_id}", json={"name": "Support"})
    assert client.get(f"/api/route/{route_id}").json()["name"] == "Support"

    # Delete Route
    assert client.delete(f"/api/route/{route_id}").status_code == 204
    assert client.get(f"/api/route/{route_id}").status_code == 404


def test_crud_404_errors():
    # LLM 404s
    assert client.get("/api/llm/999").status_code == 404
    assert client.put("/api/llm/999", json={"name": "X"}).status_code == 404
    assert client.delete("/api/llm/999").status_code == 404

    # Route 404s
    assert client.get("/api/route/999").status_code == 404
    assert client.put("/api/route/999", json={"name": "X"}).status_code == 404
    assert client.delete("/api/route/999").status_code == 404

    # Utterance 404s
    assert (
        client.post("/api/route/999/utterance", json={"utterance": "X"}).status_code
        == 404
    )

    # Create a real route to test utterance 404s on existing route
    llm_id = client.post("/api/llm", json={"name": "L", "url": "U"}).json()["id"]
    route_id = client.post("/api/route", json={"name": "R", "llm": llm_id}).json()["id"]

    assert client.get(f"/api/route/{route_id}/utterance/999").status_code == 404
    assert (
        client.put(
            f"/api/route/{route_id}/utterance/999", json={"utterance": "X"}
        ).status_code
        == 404
    )
    assert client.delete(f"/api/route/{route_id}/utterance/999").status_code == 404

    # Log 404
    assert client.delete("/api/log/non-existent").status_code == 404


# --- Utterance Tests ---


def test_utterance_lifecycle():
    # Setup
    llm_id = client.post("/api/llm", json={"name": "L", "url": "U"}).json()["id"]
    route_id = client.post("/api/route", json={"name": "R", "llm": llm_id}).json()["id"]

    # Create Utterance
    utt_resp = client.post(
        f"/api/route/{route_id}/utterance", json={"utterance": "hello"}
    )
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
    assert (
        client.get(f"/api/route/{route_id}/utterance/{utt_id}").json()["utterance"]
        == "hi"
    )

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


def test_config_auto_create():
    # PUT config when none exists (e.g. database just initialized)
    # The autouse fixture drops all, but get_config might have been
    # called by other tests.
    # We can rely on the fact that setup_database runs for each test.
    update_resp = client.put("/api/config", json={"log_level": "error"})
    assert update_resp.status_code == 200
    assert update_resp.json()["log_level"] == "error"


# --- Log Tests ---


def test_log_operations():
    # We don't have a POST for logs as they are likely generated internally,
    # but we can test list and delete if we manually insert one via DB or endpoint.
    # Since there's no POST /api/log, I'll assume they exist or verify empty list.
    assert len(client.get("/api/log").json()) == 0

    # Manually insert a log via DB to test delete
    db = next(override_get_db())
    log_entry = models.Log(
        id="test-log-id",
        timestamp=datetime.now(),
        duration=0.5,
        query="test query",
        response="test response",
    )
    db.add(log_entry)
    db.commit()

    # Delete via API
    response = client.delete("/api/log/test-log-id")
    assert response.status_code == 204


def test_frontend_route():
    # We need index.html to exist for this to pass
    os.makedirs("semantic-router/frontend", exist_ok=True)
    with open("semantic-router/frontend/index.html", "w") as f:
        f.write("<html></html>")

    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_query_route():
    response = client.post("/query", json={"text": "hello"})
    assert response.status_code == 200
    assert response.json()["query"] == "hello"
    assert "route" in response.json()


def test_llm_create_secret_validation():
    # Test validator on LLMCreate (line 19 in schemas.py)
    response = client.post("/api/llm", json={"name": "X", "url": "U", "secret": "***"})
    assert response.status_code == 422
    assert "Secret cannot be '***'" in response.text


def test_get_version_failure():
    from unittest.mock import patch
    from backend.main import get_version

    with patch("builtins.open", side_effect=Exception("Read error")):
        assert get_version() == "0.0.0"


def test_env_logging():
    # Test loading log level from LOG_LEVEL environment variable
    from backend import logging_utils
    import logging

    with patch("os.getenv", return_value="debug"):
        logging_utils.setup_logging()
        assert logging.getLogger().level == logging.DEBUG

    # Test default fallback
    with patch("os.getenv", return_value=None):
        logging_utils.setup_logging()
        assert logging.getLogger().level == logging.INFO

    # Test update_log_level directly for coverage
    logging_utils.update_log_level("error")
    assert logging.getLogger().level == logging.ERROR
