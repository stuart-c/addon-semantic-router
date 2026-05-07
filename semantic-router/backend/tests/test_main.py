import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from backend.main import app
from backend.database import get_db
from backend.models import Base
from backend import models
import httpx
from datetime import datetime
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


class ClientProxy:
    def __getattr__(self, name):
        return getattr(current_client, name)


client = ClientProxy()
current_client = None


@pytest.fixture(autouse=True)
def setup_database():
    global current_client
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        current_client = c
        yield c
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
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


def test_fetch_llm_models():
    # Mock httpx to test the /llm/models endpoint
    with patch("httpx.AsyncClient.get") as mock_get:
        # 1. Success case
        mock_resp = MagicMock(status_code=200)
        mock_resp.json.return_value = {"data": [{"id": "model-1"}, {"id": "model-2"}]}
        mock_get.return_value = mock_resp

        resp = client.post(
            "/api/llm/models",
            json={"url": "http://test/v1/chat/completions", "secret": "s"},
        )
        assert resp.status_code == 200
        assert resp.json() == ["model-1", "model-2"]

        args, kwargs = mock_get.call_args
        assert args[0] == "http://test/v1/models"
        assert kwargs["headers"]["Authorization"] == "Bearer s"

        # 2. Endswith / slash case
        resp = client.post("/api/llm/models", json={"url": "http://test/"})
        assert resp.status_code == 200
        args, kwargs = mock_get.call_args
        assert args[0] == "http://test/v1/models"

        # 3. Normal URL case
        resp = client.post("/api/llm/models", json={"url": "http://test"})
        assert resp.status_code == 200
        args, kwargs = mock_get.call_args
        assert args[0] == "http://test/v1/models"

        # 4. HTTP Error case
        mock_err_resp = MagicMock(status_code=500)
        mock_err_resp.raise_for_status.side_effect = httpx.HTTPError("Network Error")
        mock_get.return_value = mock_err_resp

        resp = client.post("/api/llm/models", json={"url": "http://test"})
        assert resp.status_code == 502
        assert "Failed to fetch models" in resp.text

        # 5. General Exception case
        mock_get.side_effect = Exception("General Error")
        resp = client.post("/api/llm/models", json={"url": "http://test"})
        assert resp.status_code == 500
        assert "Internal error" in resp.text


def test_fetch_llm_models_validation():
    # Test line 36 in crud.py
    resp = client.post("/api/llm/models", json={"url": ""})
    assert resp.status_code == 400
    assert "URL is required" in resp.text


def test_fetch_llm_models_empty_data():
    # Test line 58 in crud.py
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock(status_code=200)
        mock_resp.json.return_value = {"not_data": []}
        mock_get.return_value = mock_resp

        resp = client.post("/api/llm/models", json={"url": "http://test"})
        assert resp.status_code == 200
        assert resp.json() == []


def test_fetch_llm_models_with_id():
    # Setup: Create an LLM with a secret
    create_resp = client.post(
        "/api/llm",
        json={
            "name": "Test LLM",
            "url": "http://stored-url",
            "secret": "stored-secret",
        },
    )
    llm_id = create_resp.json()["id"]

    # Mock httpx
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock(status_code=200)
        mock_resp.json.return_value = {"data": [{"id": "m1"}]}
        mock_get.return_value = mock_resp

        # Call with ID and empty secret/url
        resp = client.post(
            "/api/llm/models",
            json={"id": llm_id},
        )
        assert resp.status_code == 200
        assert resp.json() == ["m1"]

        args, kwargs = mock_get.call_args
        assert args[0] == "http://stored-url/v1/models"
        assert kwargs["headers"]["Authorization"] == "Bearer stored-secret"

        # Call with ID and override URL
        resp = client.post(
            "/api/llm/models",
            json={"id": llm_id, "url": "http://new-url/"},
        )
        assert resp.status_code == 200
        args, kwargs = mock_get.call_args
        assert args[0] == "http://new-url/v1/models"
        assert kwargs["headers"]["Authorization"] == "Bearer stored-secret"


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
    update_resp = client.put("/api/config", json={"log_level": "error"})
    assert update_resp.status_code == 200
    assert update_resp.json()["log_level"] == "error"


# --- Log Tests ---


def test_log_operations():
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


def test_log_create_dict():
    from backend import crud

    db = next(override_get_db())
    log_data = {
        "id": "test-dict-log",
        "timestamp": datetime.now(),
        "duration": 0.1,
        "query": "dict query",
        "response": "dict response",
    }
    obj = crud.log.create(db, obj_in=log_data)
    assert obj.id == "test-dict-log"
    assert obj.query == "dict query"
    crud.log.remove(db, id="test-dict-log")


def test_frontend_route():
    from fastapi.responses import HTMLResponse

    with patch(
        "backend.routes.frontend.FileResponse",
        return_value=HTMLResponse("<html></html>"),
    ):
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


def get_mock_llm_response(content="Mocked response"):
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 123456789,
        "model": "test-model",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 5, "completion_tokens": 5, "total_tokens": 10},
    }


def test_query_route():
    # Setup: Create an LLM and set as default
    llm_id = client.post(
        "/api/llm", json={"name": "Test LLM", "url": "http://test.ai/v1"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock()
        mock_post.return_value.json.return_value = get_mock_llm_response()
        mock_post.return_value.status_code = 200
        mock_post.return_value.raise_for_status = MagicMock()

        response = client.post(
            "/query",
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": "hello"}],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == "Mocked response"
        assert "route" in data
        assert "llm" in data


def test_query_route_match_db():
    # Setup LLM and Route
    llm_id = client.post("/api/llm", json={"name": "T", "url": "U"}).json()["id"]
    client.post("/api/route", json={"name": "test_route", "llm": llm_id})
    client.put("/api/config", json={"default_llm": llm_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name",
            return_value="test_route",
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response("ok")

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 200
        assert response.json()["route"] == "test_route"


def test_query_route_no_llm_error():
    # Setup config with no default LLM
    client.put("/api/config", json={"default_llm": None})

    with patch(
        "backend.router_manager.router_manager.get_route_name", return_value=None
    ):
        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 500
        assert "No LLM configured" in response.text


def test_query_route_fallback_logic():
    # Setup two LLMs: Target and Fallback
    target_id = client.post(
        "/api/llm", json={"name": "Target", "url": "http://target"}
    ).json()["id"]
    fallback_id = client.post(
        "/api/llm", json={"name": "Fallback", "url": "http://fallback"}
    ).json()["id"]

    client.post("/api/route", json={"name": "test_route", "llm": target_id})
    client.put("/api/config", json={"default_llm": fallback_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name",
            return_value="test_route",
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        # First call fails, second succeeds
        target_resp = MagicMock(status_code=500)
        target_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Err", request=MagicMock(), response=target_resp
        )

        fallback_resp = MagicMock(status_code=200)
        fallback_resp.json.return_value = get_mock_llm_response("fallback success")

        mock_post.side_effect = [target_resp, fallback_resp]

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 200
        assert "fallback success" in response.text
        assert response.json()["route"] == "test_route (fallback)"


def test_query_route_both_fail():
    target_id = client.post("/api/llm", json={"name": "T", "url": "U"}).json()["id"]
    client.put("/api/config", json={"default_llm": target_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name", return_value=None
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        resp = MagicMock(status_code=500)
        resp.raise_for_status.side_effect = Exception("Failure")
        mock_post.return_value = resp

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 502


def test_query_route_target_is_fallback_fail():
    target_id = client.post("/api/llm", json={"name": "T", "url": "U"}).json()["id"]
    client.put("/api/config", json={"default_llm": target_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name", return_value=None
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        resp = MagicMock(status_code=400)
        err_data = get_mock_llm_response("error from llm")
        resp.json.return_value = err_data
        resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Err", request=MagicMock(), response=resp
        )
        mock_post.return_value = resp

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 400
        assert response.json()["choices"][0]["message"]["content"] == "error from llm"


def test_query_route_target_fail_no_fallback():
    llm_id = client.post("/api/llm", json={"name": "T", "url": "U"}).json()["id"]
    client.post("/api/route", json={"name": "test", "llm": llm_id})
    client.put("/api/config", json={"default_llm": None})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name", return_value="test"
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        resp = MagicMock(status_code=500)
        resp.raise_for_status.side_effect = Exception("Fail")
        mock_post.return_value = resp

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 502
        assert "llm call failed" in response.text.lower()


def test_query_route_both_target_and_fallback_fail():
    target_id = client.post(
        "/api/llm", json={"name": "Target", "url": "http://target"}
    ).json()["id"]
    fallback_id = client.post(
        "/api/llm", json={"name": "Fallback", "url": "http://fallback"}
    ).json()["id"]

    client.post("/api/route", json={"name": "test_route", "llm": target_id})
    client.put("/api/config", json={"default_llm": fallback_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name",
            return_value="test_route",
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        # Both calls fail
        resp = MagicMock(status_code=500)
        resp.raise_for_status.side_effect = Exception("Total failure")
        mock_post.return_value = resp

        response = client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )
        assert response.status_code == 502
        assert "both failed" in response.text.lower()


def test_query_route_llm_overrides():
    llm_id = client.post(
        "/api/llm", json={"name": "O", "url": "http://o", "secret": "s", "model": "m"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    with (
        patch(
            "backend.router_manager.router_manager.get_route_name", return_value=None
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response("ok")

        client.post(
            "/query",
            json={"model": "m", "messages": [{"role": "user", "content": "x"}]},
        )

        # Verify call arguments (secret and model)
        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer s"
        assert kwargs["json"]["model"] == "m"


def test_llm_create_secret_validation():
    # Test validator on LLMCreate (line 19 in schemas.py)
    response = client.post("/api/llm", json={"name": "X", "url": "U", "secret": "***"})
    assert response.status_code == 422
    assert "Secret cannot be '***'" in response.text


def test_get_version_failure():
    from unittest.mock import patch
    from backend.utils import get_version

    with patch("backend.utils.open", side_effect=Exception("Read error")):
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


def test_query_route_no_model():
    # Setup: Create an LLM with NO model set and set as default
    llm_id = client.post(
        "/api/llm", json={"name": "No Model LLM", "url": "http://test.ai/v1"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        # Send request WITHOUT model
        response = client.post(
            "/query",
            json={
                "messages": [{"role": "user", "content": "hello"}],
            },
        )
        assert response.status_code == 200

        # Verify 'model' was NOT sent in the payload
        args, kwargs = mock_post.call_args
        assert "model" not in kwargs["json"]


def test_query_route_model_in_request():
    # Setup: Create an LLM with NO model set and set as default
    llm_id = client.post(
        "/api/llm", json={"name": "No Model LLM", "url": "http://test.ai/v1"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        # Send request WITH model
        response = client.post(
            "/query",
            json={
                "model": "request-model",
                "messages": [{"role": "user", "content": "hello"}],
            },
        )
        assert response.status_code == 200

        # Verify 'model' WAS sent in the payload
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["model"] == "request-model"


def test_query_route_model_from_llm_config():
    # Setup: Create an LLM WITH a model set and set as default
    llm_id = client.post(
        "/api/llm",
        json={
            "name": "Model LLM",
            "url": "http://test.ai/v1",
            "model": "llm-config-model",
        },
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        # Send request WITHOUT model
        response = client.post(
            "/query",
            json={
                "messages": [{"role": "user", "content": "hello"}],
            },
        )
        assert response.status_code == 200

        # Verify 'model' WAS sent in the payload (from LLM config)
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["model"] == "llm-config-model"


def test_resolve_prompt_route():
    # Setup
    with patch("backend.router_manager.router_manager.resolve") as mock_resolve:
        # 1. Match case
        mock_result = MagicMock()
        mock_result.name = "test_route"
        mock_result.score = 0.85
        mock_resolve.return_value = mock_result

        response = client.post("/api/test/resolve", json={"prompt": "test prompt"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test_route"
        assert data["score"] == 0.85

        # 2. No match case
        mock_resolve.return_value = None
        response = client.post("/api/test/resolve", json={"prompt": "unknown"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] is None
        assert data["score"] == 0.0


def test_main_static_mounts():
    # Test the static file mounting logic in main.py
    from backend.main import setup_static_files

    mock_app = MagicMock()
    with (
        patch("backend.main.os.path.exists", return_value=True),
        patch("backend.main.StaticFiles", return_value=MagicMock()),
    ):
        setup_static_files(mock_app)

    # Check if mount was called for /assets and /static
    mount_paths = [call.args[0] for call in mock_app.mount.call_args_list]
    assert "/assets" in mount_paths
    assert "/static" in mount_paths
