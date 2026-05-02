from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
import os

# Use /data for Home Assistant persistence, fallback to local data dir
if os.path.exists("/data"):
    SQLALCHEMY_DATABASE_URL = "sqlite:///Core_Home_Assistant_Persistent_Storage"
    # Actually, HA addons use /data/ for persistent storage.
    SQLALCHEMY_DATABASE_URL = "sqlite:////data/semantic_router.db"
else:
    os.makedirs("data", exist_ok=True)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./data/semantic_router.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
