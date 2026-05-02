import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
from . import models, routes, logging_utils, utils
from .database import engine
from .tasks import log_cleanup_task

# Create database tables
models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize logging from HA options
    logging_utils.setup_logging()

    # Start background tasks
    cleanup_task = asyncio.create_task(log_cleanup_task())

    yield

    # Cancel background tasks on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


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
