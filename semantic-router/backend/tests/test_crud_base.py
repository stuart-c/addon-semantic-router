import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.crud.base import CRUDBase
from backend.models import Base, LLM
from backend.schemas import LLMCreate
import os

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_crud_base.db"
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
        if os.path.exists("./test_crud_base.db"):
            os.remove("./test_crud_base.db")


def test_crud_base_get_multi(db):
    crud = CRUDBase(LLM)
    # Create 5 LLMs
    for i in range(5):
        crud.create(db, obj_in=LLMCreate(name=f"LLM {i}", url=f"U {i}"))

    # Test skip and limit
    all_llms = crud.get_multi(db)
    assert len(all_llms) == 5

    partial = crud.get_multi(db, skip=1, limit=2)
    assert len(partial) == 2
    assert partial[0].name == "LLM 1"
    assert partial[1].name == "LLM 2"


def test_crud_base_update_with_dict(db):
    crud = CRUDBase(LLM)
    llm = crud.create(db, obj_in=LLMCreate(name="Original", url="U"))

    # Update with dict (covers line 51 in base.py)
    updated = crud.update(db, db_obj=llm, obj_in={"name": "Updated"})
    assert updated.name == "Updated"
    assert updated.url == "U"


def test_crud_base_remove_not_found(db):
    crud = CRUDBase(LLM)
    # Remove something that doesn't exist
    result = crud.remove(db, id=999)
    assert result is None
