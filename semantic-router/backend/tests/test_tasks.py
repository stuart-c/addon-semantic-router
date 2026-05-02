import pytest
import asyncio
import os
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.tasks import log_cleanup_task
from backend import models

# Use a separate test database for logic testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_tasks.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    models.Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        models.Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_tasks.db"):
            os.remove("./test_tasks.db")


def test_log_cleanup_task_execution():
    # Mock dependencies
    mock_db = MagicMock()
    mock_session_local = MagicMock(return_value=mock_db)
    mock_config = MagicMock()
    mock_config.log_retention = 30

    async def run_test():
        with (
            patch("backend.tasks.SessionLocal", mock_session_local),
            patch("backend.tasks.crud_config.get_config", return_value=mock_config),
            patch(
                "backend.tasks.crud_log.cleanup_old_logs", return_value=5
            ) as mock_cleanup,
            patch("backend.tasks.asyncio.sleep", side_effect=asyncio.CancelledError),
        ):
            try:
                await log_cleanup_task()
            except asyncio.CancelledError:
                pass

            # Verify calls
            mock_cleanup.assert_called_once()
            # Verify vacuum was executed
            mock_db.execute.assert_called()
            args, _ = mock_db.execute.call_args
            assert "VACUUM" in str(args[0])

    asyncio.run(run_test())


def test_cleanup_old_logs_logic(db_session):
    from backend.crud.log import log as crud_log

    # Create logs: one old, one new
    old_date = datetime.utcnow() - timedelta(days=40)
    new_date = datetime.utcnow() - timedelta(days=10)

    old_log = models.Log(
        id="old-log", timestamp=old_date, duration=1.0, query="old", response="old"
    )
    new_log = models.Log(
        id="new-log", timestamp=new_date, duration=1.0, query="new", response="new"
    )

    db_session.add(old_log)
    db_session.add(new_log)
    db_session.commit()

    # Run cleanup with 30 days retention
    deleted_count = crud_log.cleanup_old_logs(db_session, 30)

    assert deleted_count == 1

    # Verify remaining logs
    remaining = db_session.query(models.Log).all()
    assert len(remaining) == 1
    assert remaining[0].id == "new-log"
