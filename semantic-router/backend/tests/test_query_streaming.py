import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from backend.main import app
from backend.database import get_db
from backend.models import Base
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_streaming.db"
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


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
    for ext in ["", "-shm", "-wal"]:
        path = f"./test_streaming.db{ext}"
        if os.path.exists(path):
            os.remove(path)


client = TestClient(app)


def test_query_streaming_success():
    # Setup: Create an LLM and set as default
    llm_id = client.post(
        "/api/llm", json={"name": "Stream LLM", "url": "http://stream.ai"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    # Mock data
    chunks = [
        'data: {"id": "1", "choices": [{"delta": {"content": "Hello"}}]}',
        'data: {"id": "1", "choices": [{"delta": {"content": " world"}}]}',
        "data: [DONE]",
    ]

    class MockResponse:
        def __init__(self):
            self.status_code = 200

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        def raise_for_status(self):
            pass

        async def aiter_lines(self):
            for chunk in chunks:
                yield chunk

    with patch("httpx.AsyncClient.stream", return_value=MockResponse()):
        response = client.post(
            "/query",
            json={
                "stream": True,
                "messages": [{"role": "user", "content": "hi"}],
            },
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        # TestClient.post returns the full content for streaming responses
        content = response.text
        lines = [line for line in content.split("\n\n") if line.strip()]
        assert len(lines) == 3
        assert "Hello" in lines[0]
        assert " world" in lines[1]
        assert "[DONE]" in lines[2]

        # Verify that it was logged (check logs)
        log_resp = client.get("/api/log")
        assert log_resp.status_code == 200
        logs = log_resp.json()
        assert len(logs) == 1
        assert "Hello world" in logs[0]["response"]


def test_query_streaming_error_during_stream():
    llm_id = client.post(
        "/api/llm", json={"name": "Error LLM", "url": "http://error.ai"}
    ).json()["id"]
    client.put("/api/config", json={"default_llm": llm_id})

    class MockResponseError:
        def __init__(self):
            self.status_code = 200

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        def raise_for_status(self):
            pass

        async def aiter_lines(self):
            yield 'data: {"choices": [{"delta": {"content": "Start"}}]}'
            raise Exception("Mid-stream failure")

    with patch("httpx.AsyncClient.stream", return_value=MockResponseError()):
        response = client.post(
            "/query",
            json={
                "stream": True,
                "messages": [{"role": "user", "content": "hi"}],
            },
        )
        assert response.status_code == 200
        assert "Mid-stream failure" in response.text
        assert "stream_error" in response.text

        # Verify log captures error
        log_resp = client.get("/api/log")
        logs = log_resp.json()
        assert len(logs) == 1
        assert "Mid-stream failure" in logs[0]["failure_reason"]
