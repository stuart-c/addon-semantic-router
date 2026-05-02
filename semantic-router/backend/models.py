import enum
from sqlalchemy.orm import DeclarativeBase, relationship

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
    CheckConstraint,
)


class Base(DeclarativeBase):
    pass


class LogLevel(enum.Enum):
    all = "all"
    default = "default"
    error = "error"
    info = "info"
    debug = "debug"
    warning = "warning"
    critical = "critical"


class LLM(Base):
    __tablename__ = "llm"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    url = Column(String)
    secret = Column(String)
    timeout = Column(Integer)
    enabled = Column(Boolean, default=True)

    routes = relationship("Route", back_populates="llm_rel")
    logs = relationship("Log", back_populates="llm_rel")


class Route(Base):
    __tablename__ = "route"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    llm = Column(Integer, ForeignKey("llm.id"))
    enabled = Column(Boolean, default=True)

    llm_rel = relationship("LLM", back_populates="routes")
    utterances = relationship("RouteUtterance", back_populates="route_rel")
    logs = relationship("Log", back_populates="route_rel")


class RouteUtterance(Base):
    __tablename__ = "route_utterance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(Integer, ForeignKey("route.id"))
    utterance = Column(String)

    route_rel = relationship("Route", back_populates="utterances")


class Config(Base):
    __tablename__ = "config"
    __table_args__ = (CheckConstraint("id = 1", name="config_singleton"),)

    id = Column(Integer, primary_key=True, default=1)
    default_llm = Column(Integer, ForeignKey("llm.id"))
    log_level = Column(Enum(LogLevel))
    log_retention = Column(Integer, default=30)

    llm_rel = relationship("LLM")


class Log(Base):
    __tablename__ = "log"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime)
    duration = Column(Float)
    route = Column(Integer, ForeignKey("route.id"))
    query = Column(String)
    response = Column(String)
    llm = Column(Integer, ForeignKey("llm.id"))
    original_id = Column(String)

    route_rel = relationship("Route", back_populates="logs")
    llm_rel = relationship("LLM", back_populates="logs")
