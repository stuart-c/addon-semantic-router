from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .models import LogLevel


# LLM Schemas
class LLMBase(BaseModel):
    name: str
    url: str
    secret: Optional[str] = None
    timeout: Optional[int] = 30


class LLMCreate(LLMBase):
    pass


class LLMUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    secret: Optional[str] = None
    timeout: Optional[int] = None


class LLM(LLMBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Route Utterance Schemas
class RouteUtteranceBase(BaseModel):
    utterance: str


class RouteUtteranceCreate(RouteUtteranceBase):
    pass


class RouteUtteranceUpdate(BaseModel):
    utterance: Optional[str] = None


class RouteUtterance(RouteUtteranceBase):
    id: int
    route_id: int
    model_config = ConfigDict(from_attributes=True)


# Route Schemas
class RouteBase(BaseModel):
    name: str
    llm: int


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    llm: Optional[int] = None


class Route(RouteBase):
    id: int
    utterances: List[RouteUtterance] = []
    model_config = ConfigDict(from_attributes=True)


# Config Schemas
class ConfigBase(BaseModel):
    default_llm: Optional[int] = None
    log_level: LogLevel = LogLevel.default


class ConfigUpdate(BaseModel):
    default_llm: Optional[int] = None
    log_level: Optional[LogLevel] = None


class ConfigSchema(ConfigBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Log Schemas
class LogBase(BaseModel):
    id: str
    timestamp: datetime
    duration: float
    route: Optional[int] = None
    query: str
    response: str
    llm: Optional[int] = None
    original_id: Optional[str] = None


class Log(LogBase):
    model_config = ConfigDict(from_attributes=True)
