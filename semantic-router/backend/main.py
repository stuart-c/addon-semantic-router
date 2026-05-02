from fastapi import FastAPI

from contextlib import asynccontextmanager
from . import models, routes, logging_utils, utils
from .database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize logging from HA options
    logging_utils.setup_logging()
    yield


app = FastAPI(
    title="Semantic Router API",
    description="RESTful API for the Semantic Router backend",
    version=utils.get_version(),
    lifespan=lifespan,
)

# Include the CRUD routes with the /api prefix
app.include_router(routes.crud.router, prefix="/api")

# Include the Query routes
app.include_router(routes.query.router)

# Include the Frontend routes at the root
# Include the Query routes at the root
app.include_router(routes.query.router)

app.include_router(routes.frontend.router)
