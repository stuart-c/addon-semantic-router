from unittest.mock import patch, MagicMock


def test_database_init_local():
    # Test local database initialization
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = False
        # Re-import or reload to trigger the logic
        import importlib
        from backend import database

        importlib.reload(database)
        assert "data/semantic_router.db" in database.SQLALCHEMY_DATABASE_URL


def test_database_init_ha():
    # Test Home Assistant database initialization
    with patch("os.path.exists") as mock_exists:
        # Mock /data exists
        def side_effect(path):
            return path == "/data"

        mock_exists.side_effect = side_effect

        import importlib
        from backend import database

        importlib.reload(database)
        assert "/data/semantic_router.db" in database.SQLALCHEMY_DATABASE_URL


def test_get_db_yields_and_closes():
    from backend.database import get_db

    mock_session = MagicMock()
    with patch("backend.database.SessionLocal", return_value=mock_session):
        gen = get_db()
        db = next(gen)
        assert db == mock_session
        try:
            next(gen)
        except StopIteration:
            pass
        mock_session.close.assert_called_once()
