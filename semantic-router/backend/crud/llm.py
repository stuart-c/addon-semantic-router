from typing import Any, Optional
from sqlalchemy.orm import Session
from .base import CRUDBase
from .exceptions import IntegrityViolationError
from ..models import LLM, Route, Config
from ..schemas import LLMCreate, LLMUpdate


class CRUDLLM(CRUDBase[LLM, LLMCreate, LLMUpdate]):
    def remove(self, db: Session, *, id: Any) -> Optional[LLM]:
        # Check if used by any route
        if db.query(Route).filter(Route.llm == id).first():
            raise IntegrityViolationError("LLM is in use by one or more routes")

        # Check if used by default config
        if db.query(Config).filter(Config.default_llm == id).first():
            raise IntegrityViolationError("LLM is in use as the default LLM")

        return super().remove(db, id=id)


llm = CRUDLLM(LLM)
