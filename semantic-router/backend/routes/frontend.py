from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/")
async def get_frontend():
    # Serve index.html from the frontend directory
    index_path = os.path.join(os.path.dirname(__file__), "../../frontend/index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    # Fallback for when the file doesn't exist (should only happen in misconfigured dev)
    return {"message": "Frontend not found"}
