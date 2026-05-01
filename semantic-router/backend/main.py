from fastapi import FastAPI
from . import models, routes
from .database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Semantic Router API",
    description="RESTful API for the Semantic Router backend",
    version="0.1.0"
)

# Include the main router with the /api prefix
app.include_router(routes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to the Semantic Router API. Go to /api/health for status or /docs for documentation."}
