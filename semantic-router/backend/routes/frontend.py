from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter()


@router.get("/")
def serve_frontend():
    # Path is relative to this file: backend/routes/frontend.py
    # index.html is in frontend/index.html
    frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend/index.html")
    return FileResponse(frontend_path)
