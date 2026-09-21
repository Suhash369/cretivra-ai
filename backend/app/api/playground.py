from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import UserDB
from app.api.auth import get_optional_user
from app.api.agents import get_current_or_guest_user
from app.agents.runtime.agent_runtime import agent_runtime

router = APIRouter(prefix="/playground", tags=["Playground"])

class PlaygroundStreamRequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None
    model_id: Optional[str] = "cretivra-1"

@router.post("/execute")
async def playground_execute(
    payload: PlaygroundStreamRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Task prompt cannot be empty.")

    user = get_current_or_guest_user(db, current_user)
    run = await agent_runtime.create_and_execute_run(
        db=db,
        user_id=user.id,
        prompt=payload.prompt.strip(),
        project_id=payload.project_id,
        model_id=payload.model_id
    )

    return {
        "run_id": run.id,
        "status": run.status,
        "intent": run.intent,
        "project_id": run.project_id,
        "stream_url": f"/api/playground/stream/{run.id}"
    }

@router.get("/stream/{run_id}")
async def stream_run_by_id(
    run_id: str,
    db: Session = Depends(get_db)
):
    """
    Connects an SSE stream to a running agent task graph.
    """
    stream_generator = agent_runtime.execute_run_stream(db, run_id)
    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/stream")
async def stream_direct_task(
    payload: PlaygroundStreamRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Creates run and streams SSE event chunks directly in a single request.
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Task prompt cannot be empty.")

    user = get_current_or_guest_user(db, current_user)
    run = await agent_runtime.create_and_execute_run(
        db=db,
        user_id=user.id,
        prompt=payload.prompt.strip(),
        project_id=payload.project_id,
        model_id=payload.model_id
    )

    stream_generator = agent_runtime.execute_run_stream(db, run.id)
    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
