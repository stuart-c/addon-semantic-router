from pydantic import BaseModel, ConfigDict, field_validator, field_serializer
from typing import Optional, List
from datetime import datetime
from .models import LogLevel


# LLM Schemas
class LLMBase(BaseModel):
    name: str
    url: str
    secret: Optional[str] = None
    timeout: Optional[int] = 30
    enabled: bool = True

    @field_validator("secret")
    @classmethod
    def check_secret(cls, v: Optional[str]) -> Optional[str]:
        if v == "***":
            raise ValueError("Secret cannot be '***'")
        return v


class LLMCreate(LLMBase):
    pass


class LLMUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    secret: Optional[str] = None
    timeout: Optional[int] = None
    enabled: Optional[bool] = None

    @field_validator("secret")
    @classmethod
    def check_secret(cls, v: Optional[str]) -> Optional[str]:
        if v == "***":
            raise ValueError("Secret cannot be '***'")
        return v


class LLM(LLMBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("secret")
    def serialize_secret(self, secret: Optional[str]) -> str:
        if secret:
            return "***"
        return ""


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
    enabled: bool = True


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    llm: Optional[int] = None
    enabled: Optional[bool] = None


class Route(RouteBase):
    id: int
    utterances: List[RouteUtterance] = []
    model_config = ConfigDict(from_attributes=True)


# Config Schemas
class ConfigBase(BaseModel):
    default_llm: Optional[int] = None
    log_level: LogLevel = LogLevel.default
    log_retention: int = 30


class ConfigUpdate(BaseModel):
    default_llm: Optional[int] = None
    log_level: Optional[LogLevel] = None
    log_retention: Optional[int] = None


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


# OpenAI Compatible Schemas
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 1.0
    top_p: Optional[float] = 1.0
    n: Optional[int] = 1
    stream: Optional[bool] = False
    stop: Optional[List[str]] = None
    max_tokens: Optional[int] = None
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
    user: Optional[str] = None


class ChatCompletionResponseChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str


class ChatCompletionUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionResponseChoice]
    usage: ChatCompletionUsage
    # Custom fields for Semantic Router
    route: Optional[str] = None
    llm: Optional[str] = None
