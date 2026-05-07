import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
import httpx
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import get_db
from backend.models import Base
from backend import models
from backend.crud.log import CRUDLog

# Use a separate test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_query_cov.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
    if os.path.exists("./test_query_cov.db"):
        os.remove("./test_query_cov.db")


# Use raise_server_exceptions=False to test 500 errors
client = TestClient(app, raise_server_exceptions=False)


def get_mock_llm_response():
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": "gpt-3.5-turbo-0613",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello there!",
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 9,
            "completion_tokens": 12,
            "total_tokens": 21,
        },
    }


def test_query_logging_exception():
    # Setup LLM and Config
    with TestingSessionLocal() as db:
        llm = models.LLM(name="L", url="U")
        db.add(llm)
        db.commit()
        db.refresh(llm)
        config = models.Config(id=1, default_llm=llm.id, log_level=models.LogLevel.all)
        db.merge(config)
        db.commit()

    with (
        patch.object(CRUDLog, "create", side_effect=Exception("DB error")),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        # This should NOT raise an exception because it's caught in _do_log
        response = client.post(
            "/query", json={"messages": [{"role": "user", "content": "hello"}]}
        )
        assert response.status_code == 200


def test_query_route_not_in_db():
    with TestingSessionLocal() as db:
        llm = models.LLM(name="L", url="U")
        db.add(llm)
        db.commit()
        db.refresh(llm)
        config = models.Config(id=1, default_llm=llm.id)
        db.merge(config)
        db.commit()

    with (
        patch(
            "backend.routes.query.router_manager.get_route_name",
            return_value="ghost_route",
        ),
        patch("httpx.AsyncClient.post") as mock_post,
    ):
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        response = client.post(
            "/query", json={"messages": [{"role": "user", "content": "hello"}]}
        )
        assert response.status_code == 200
        # The code changes route_match_name to "fallback" if not in DB
        assert response.json()["route"] == "fallback"


def test_query_http_exception_passthrough():
    with TestingSessionLocal() as db:
        llm = models.LLM(name="L", url="U")
        db.add(llm)
        db.commit()
        db.refresh(llm)
        config = models.Config(id=1, default_llm=llm.id)
        db.merge(config)
        db.commit()

    with (
        patch(
            "httpx.AsyncClient.post",
            side_effect=HTTPException(status_code=401, detail="Auth failed"),
        ),
    ):
        response = client.post(
            "/query", json={"messages": [{"role": "user", "content": "hello"}]}
        )
        assert response.status_code == 401
        assert "Auth failed" in response.text


def test_query_fallback_llm_status_error():
    with TestingSessionLocal() as db:
        t_llm = models.LLM(name="Target", url="http://target")
        f_llm = models.LLM(name="Fallback", url="http://fallback")
        db.add_all([t_llm, f_llm])
        db.commit()
        db.refresh(t_llm)
        db.refresh(f_llm)
        route = models.Route(name="r", llm=t_llm.id, enabled=True)
        db.add(route)
        config = models.Config(id=1, default_llm=f_llm.id)
        db.merge(config)
        db.commit()

    # Target fails with generic exception
    resp1 = MagicMock()
    resp1.raise_for_status.side_effect = Exception("Target failed")

    # Fallback fails with HTTPStatusError
    resp2_httpx = httpx.Response(
        403,
        json={"error": "forbidden"},
        request=httpx.Request("POST", "http://fallback"),
    )
    error = httpx.HTTPStatusError(
        "Forbidden", request=resp2_httpx.request, response=resp2_httpx
    )

    with (
        patch("backend.routes.query.router_manager.get_route_name", return_value="r"),
        patch("backend.routes.query._call_llm", new_callable=AsyncMock) as mock_call,
    ):
        # First call (target) raises generic exception
        # Second call (fallback) raises HTTPStatusError
        mock_call.side_effect = [Exception("Target failed"), error]

        response = client.post(
            "/query", json={"messages": [{"role": "user", "content": "hello"}]}
        )
        assert response.status_code == 403
        assert response.json()["error"] == "forbidden"


def test_query_general_exception():
    with patch(
        "backend.routes.query.router_manager.get_route_name",
        side_effect=RuntimeError("Generic crash"),
    ):
        response = client.post(
            "/query", json={"messages": [{"role": "user", "content": "hello"}]}
        )
        assert response.status_code == 500


def test_query_model_override_log():
    with TestingSessionLocal() as db:
        llm = models.LLM(name="L", url="U", model="forced-model")
        db.add(llm)
        db.commit()
        db.refresh(llm)
        config = models.Config(id=1, default_llm=llm.id)
        db.merge(config)
        db.commit()

    with (
        patch("httpx.AsyncClient.post") as mock_post,
        patch("backend.routes.query.logger.info") as mock_logger_info,
    ):
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        client.post(
            "/query",
            json={
                "model": "original-model",
                "messages": [{"role": "user", "content": "hello"}],
            },
        )

        assert any(
            "Overriding request model" in call.args[0]
            for call in mock_logger_info.call_args_list
        )


def test_query_url_placeholder():
    with TestingSessionLocal() as db:
        llm = models.LLM(name="L", url="http://api/{model}/v1", model="my-model")
        db.add(llm)
        db.commit()
        db.refresh(llm)
        config = models.Config(id=1, default_llm=llm.id)
        db.merge(config)
        db.commit()

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = get_mock_llm_response()

        client.post("/query", json={"messages": [{"role": "user", "content": "hello"}]})

        args, kwargs = mock_post.call_args
        assert args[0] == "http://api/my-model/v1"
