import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager
from . import models, routes, logging_utils, utils
from .database import engine, SessionLocal
from .tasks import log_cleanup_task
from .router_manager import router_manager

# Create database tables
models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize logging from HA options
    logging_utils.setup_logging()

    # Initialize RouteLayer
    db = SessionLocal()
    try:
        router_manager.initialize(db)
    finally:
        db.close()

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

# Include the Query routes at the root
app.include_router(routes.query.router)

app.include_router(routes.frontend.router)


def setup_static_files(app: FastAPI):
    """Setup static file mounting for the frontend."""
    frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
    if os.path.exists(frontend_dist):
        app.mount(
            "/assets",
            StaticFiles(directory=os.path.join(frontend_dist, "assets")),
            name="assets",
        )
        # Also mount root files like favicon.ico, etc if they exist in dist
        app.mount("/static", StaticFiles(directory=frontend_dist), name="static")


setup_static_files(app)
