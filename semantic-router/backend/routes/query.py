import time
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas

router = APIRouter()


@router.post("/query", response_model=schemas.ChatCompletionResponse)
def semantic_query(
    request: schemas.ChatCompletionRequest, db: Session = Depends(get_db)
):
    # Placeholder for semantic routing logic
    # Extract the last message content as the query
    query_text = request.messages[-1].content if request.messages else ""

    # Mock response following OpenAI format
    return schemas.ChatCompletionResponse(
        id=f"chatcmpl-{uuid.uuid4()}",
        created=int(time.time()),
        model=request.model,
        choices=[
            schemas.ChatCompletionResponseChoice(
                index=0,
                message=schemas.ChatMessage(
                    role="assistant", content=f"Processed query: {query_text}"
                ),
                finish_reason="stop",
            )
        ],
        usage=schemas.ChatCompletionUsage(
            prompt_tokens=10, completion_tokens=10, total_tokens=20
        ),
        route="default",
        llm="default-llm",
    )
