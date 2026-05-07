import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.router_manager import RouteLayerManager
from backend.models import Base, Route, RouteUtterance
import os

# Setup test DB
SQLALCHEMY_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "sqlite:///./test_router_manager.db"
)
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


def test_router_manager_singleton():
    # Test __new__ (line 23)
    RouteLayerManager._instance = None
    manager1 = RouteLayerManager()
    manager2 = RouteLayerManager()
    assert manager1 is manager2
    assert manager1._instance is manager2


def test_router_manager_initialize_fastembed(db, manager):
    with (
        patch("backend.router_manager.FastEmbedEncoder") as mock_fe,
        patch("backend.router_manager.SemanticRouter") as mock_layer,
        patch("backend.router_manager.Route"),
    ):
        # Create a route in DB
        r = Route(name="test", enabled=True)
        db.add(r)
        db.commit()
        db.add(RouteUtterance(route_id=r.id, utterance="hello"))
        db.commit()

        manager.initialize(db)

        mock_fe.assert_called_once()
        # Verify cache_dir is passed
        args, kwargs = mock_fe.call_args
        assert "cache_dir" in kwargs
        mock_layer.assert_called_once()
        assert manager.get_router() is not None


def test_router_manager_no_routes(db, manager):
    with (patch("backend.router_manager.FastEmbedEncoder"),):
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
        patch(
            "backend.router_manager.FastEmbedEncoder",
            side_effect=Exception("Critical error"),
        ),
    ):
        manager.initialize(db)
        assert manager.get_router() is None


def test_router_manager_refresh(db, manager):
    with patch.object(manager, "initialize") as mock_init:
        manager.refresh(db)
        mock_init.assert_called_once_with(db)


def test_router_manager_custom_encoder(db, manager):
    # Test initialize with custom encoder (line 31)
    mock_encoder = MagicMock()
    manager.initialize(db, encoder=mock_encoder)
    assert manager._encoder == mock_encoder


def test_router_manager_tfidf_fallback(db, manager):
    # Test TfidfEncoder fallback and fitting (lines 52-55, 85-87)
    with (
        patch(
            "backend.router_manager.FastEmbedEncoder",
            side_effect=Exception("FastEmbed failed"),
        ),
        patch("semantic_router.encoders.TfidfEncoder") as mock_tfidf,
        patch("backend.router_manager.SemanticRouter"),
    ):
        mock_encoder_instance = MagicMock()
        mock_tfidf.return_value = mock_encoder_instance
        # Add a route with utterance to trigger fitting
        r = Route(name="test", enabled=True)
        db.add(r)
        db.commit()
        db.add(RouteUtterance(route_id=r.id, utterance="hello"))
        db.commit()

        manager.initialize(db)
        assert manager._encoder == mock_encoder_instance
        mock_encoder_instance.fit.assert_called_once()


def test_router_manager_resolve(db, manager):
    # Test resolve method (lines 127-136)
    mock_router = MagicMock()
    mock_choice = MagicMock()
    mock_choice.name = "test_route"
    mock_choice.score = 0.9
    mock_router.return_value = mock_choice

    manager._router = mock_router

    # Success
    res = manager.resolve("hello")
    assert res.name == "test_route"
    assert res.score == 0.9

    # Exception
    mock_router.side_effect = Exception("Resolve error")
    assert manager.resolve("hello") is None

    # No router
    manager._router = None
    assert manager.resolve("hello") is None


def test_initialize_exception(db):
    from backend.router_manager import RouteLayerManager

    manager = RouteLayerManager()
    with patch.object(db, "query", side_effect=Exception("DB Error")):
        manager.initialize(db)
        assert manager._router is None
