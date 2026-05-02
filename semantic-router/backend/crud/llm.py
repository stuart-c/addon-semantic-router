from .base import CRUDBase
from ..models import LLM
from ..schemas import LLMCreate, LLMUpdate


class CRUDLLM(CRUDBase[LLM, LLMCreate, LLMUpdate]):
    pass


llm = CRUDLLM(LLM)
