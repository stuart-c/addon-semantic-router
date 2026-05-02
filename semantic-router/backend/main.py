from fastapi import FastAPI
import os
from contextlib import asynccontextmanager
from . import models, routes, logging_utils
from .database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)


def get_version():
    config_path = os.path.join(os.path.dirname(__file__), "../config.yaml")
    try:
        with open(config_path, "r") as f:
            for line in f:
                if line.strip().startswith("version:"):
                    return line.split(":")[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return "0.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize logging from HA options
    logging_utils.setup_logging()
    yield


app = FastAPI(
    title="Semantic Router API",
    description="RESTful API for the Semantic Router backend",
    version=get_version(),
    lifespan=lifespan,
)

# Include the CRUD routes with the /api prefix
app.include_router(routes.crud.router, prefix="/api")

# Include the Query routes
app.include_router(routes.query.router)

# Include the Frontend routes at the root
app.include_router(routes.frontend.router)
