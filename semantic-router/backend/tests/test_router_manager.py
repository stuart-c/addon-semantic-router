import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.router_manager import RouteLayerManager
from backend.models import Base, Route, RouteUtterance
import os

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_router_manager.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_router_manager.db"):
            os.remove("./test_router_manager.db")


@pytest.fixture
def manager():
    # Reset the singleton for each test
    RouteLayerManager._instance = None
    RouteLayerManager._router = None
    RouteLayerManager._encoder = None
    return RouteLayerManager()


def test_router_manager_not_available(db, manager):
    with patch("backend.router_manager.SEMANTIC_ROUTER_AVAILABLE", False):
        manager.initialize(db)
        assert manager.get_router() is None


def test_router_manager_initialize_huggingface(db, manager):
    with (
        patch("backend.router_manager.SEMANTIC_ROUTER_AVAILABLE", True),
        patch("backend.router_manager.HuggingFaceEncoder") as mock_hf,
        patch("backend.router_manager.RouteLayer") as mock_layer,
        patch("backend.router_manager.Route"),
    ):
        # Create a route in DB
        r = Route(name="test", enabled=True)
        db.add(r)
        db.commit()
        db.add(RouteUtterance(route_id=r.id, utterance="hello"))
        db.commit()

        manager.initialize(db)

        mock_hf.assert_called_once()
        mock_layer.assert_called_once()
        assert manager.get_router() is not None


def test_router_manager_initialize_tfidf_fallback(db, manager):
    with (
        patch("backend.router_manager.SEMANTIC_ROUTER_AVAILABLE", True),
        patch(
            "backend.router_manager.HuggingFaceEncoder",
            side_effect=Exception("No torch"),
        ),
        patch("backend.router_manager.TfidfEncoder") as mock_tfidf,
        patch("backend.router_manager.RouteLayer"),
        patch("backend.router_manager.Route"),
    ):
        # Create a route in DB
        r = Route(name="test", enabled=True)
        db.add(r)
        db.commit()
        db.add(RouteUtterance(route_id=r.id, utterance="hello"))
        db.commit()

        manager.initialize(db)

        mock_tfidf.assert_called_once()
        assert manager.get_router() is not None


def test_router_manager_no_routes(db, manager):
    with (
        patch("backend.router_manager.SEMANTIC_ROUTER_AVAILABLE", True),
        patch("backend.router_manager.TfidfEncoder"),
    ):
        # No routes in DB
        manager.initialize(db)
        assert manager.get_router() is None


def test_router_manager_get_route_name(db, manager):
    mock_router = MagicMock()
    mock_choice = MagicMock()
    mock_choice.name = "test_route"
    mock_router.return_value = mock_choice

    manager._router = mock_router

    # Success
    assert manager.get_route_name("hello") == "test_route"

    # Exception
    mock_router.side_effect = Exception("Routing error")
    assert manager.get_route_name("hello") is None

    # No router
    manager._router = None
    assert manager.get_route_name("hello") is None


def test_router_manager_initialize_exception(db, manager):
    with (
        patch("backend.router_manager.SEMANTIC_ROUTER_AVAILABLE", True),
        patch(
            "backend.router_manager.HuggingFaceEncoder",
            side_effect=Exception("Critical error"),
        ),
    ):
        # This will trigger the outer try-except in initialize
        with patch(
            "backend.router_manager.TfidfEncoder",
            side_effect=Exception("Total failure"),
        ):
            manager.initialize(db)
            assert manager.get_router() is None


def test_router_manager_refresh(db, manager):
    with patch.object(manager, "initialize") as mock_init:
        manager.refresh(db)
        mock_init.assert_called_once_with(db)
