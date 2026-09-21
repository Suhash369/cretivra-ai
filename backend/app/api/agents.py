from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import UserDB, AgentRunDB, AgentTaskDB, AgentStepDB, ApprovalDB
from app.api.auth import get_optional_user
from app.agents.runtime.agent_runtime import agent_runtime
from app.agents.runtime.approval_manager import approval_manager
from app.agents.runtime.task_manager import task_manager
from app.services.artifact_service import artifact_service

router = APIRouter(prefix="/agents", tags=["Agents"])

class StartRunRequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None
    model_id: Optional[str] = "cretivra-1"

class ApprovalActionRequest(BaseModel):
    approval_id: str
    action: str  # approve, deny, edit
    modified_payload: Optional[Dict[str, Any]] = None

def get_current_or_guest_user(db: Session, current_user: Optional[UserDB]) -> UserDB:
    if current_user:
        return current_user
    # Local guest user
    guest = db.query(UserDB).filter(UserDB.email == "guest@asura.local").first()
    if not guest:
        from app.core.security import hash_password
        guest = UserDB(
            email="guest@asura.local",
            username="guest",
            password_hash=hash_password("asura_local_guest"),
            full_name="Local Guest Workspace"
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest

@router.post("/runs", status_code=status.HTTP_201_CREATED)
async def start_agent_run(
    payload: StartRunRequest,
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

@router.get("/runs")
def list_agent_runs(
    project_id: Optional[str] = Query(None),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user = get_current_or_guest_user(db, current_user)
    q = db.query(AgentRunDB).filter(AgentRunDB.user_id == user.id)
    if project_id:
        q = q.filter(AgentRunDB.project_id == project_id)
    runs = q.order_by(AgentRunDB.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "prompt": r.prompt,
            "intent": r.intent,
            "status": r.status,
            "duration": r.duration,
            "project_id": r.project_id,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in runs
    ]

@router.get("/runs/{run_id}")
def get_agent_run_detail(
    run_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    run = db.query(AgentRunDB).filter(AgentRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    tasks = db.query(AgentTaskDB).filter(AgentTaskDB.run_id == run_id).order_by(AgentTaskDB.task_order).all()
    artifacts = artifact_service.list_artifacts(db, run_id=run_id)
    approvals = db.query(ApprovalDB).filter(ApprovalDB.run_id == run_id).all()
    progress = task_manager.calculate_progress(db, run_id)

    return {
        "id": run.id,
        "prompt": run.prompt,
        "intent": run.intent,
        "status": run.status,
        "duration": run.duration,
        "result": run.result,
        "error": run.error,
        "progress": progress,
        "tasks": [
            {
                "id": t.id,
                "order": t.task_order,
                "type": t.task_type,
                "description": t.description,
                "status": t.status,
                "model_id": t.model_id,
                "tool_name": t.tool_name,
                "error": t.error,
                "retry_count": t.retry_count
            } for t in tasks
        ],
        "artifacts": [
            {
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "size": a.size,
                "download_url": a.download_url
            } for a in artifacts
        ],
        "approvals": [
            {
                "id": ap.id,
                "tool_name": ap.tool_name,
                "description": ap.description,
                "risk_level": ap.risk_level,
                "status": ap.status,
                "payload": ap.payload
            } for ap in approvals
        ]
    }

@router.post("/runs/{run_id}/cancel")
def cancel_agent_run(
    run_id: str,
    db: Session = Depends(get_db)
):
    run = db.query(AgentRunDB).filter(AgentRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    run.status = "CANCELLED"
    task_manager.cancel_all_tasks(db, run_id)
    db.commit()
    return {"status": "CANCELLED", "run_id": run_id}

@router.post("/runs/{run_id}/approve")
def approve_pending_action(
    run_id: str,
    payload: ApprovalActionRequest,
    db: Session = Depends(get_db)
):
    approval = approval_manager.resolve_approval(
        db=db,
        approval_id=payload.approval_id,
        action="approve",
        modified_payload=payload.modified_payload
    )
    if not approval:
        raise HTTPException(status_code=400, detail="Approval request not found or not in pending state.")
    return {"status": "approved", "approval_id": approval.id}

@router.post("/runs/{run_id}/deny")
def deny_pending_action(
    run_id: str,
    payload: ApprovalActionRequest,
    db: Session = Depends(get_db)
):
    approval = approval_manager.resolve_approval(
        db=db,
        approval_id=payload.approval_id,
        action="deny"
    )
    if not approval:
        raise HTTPException(status_code=400, detail="Approval request not found or not in pending state.")
    return {"status": "denied", "approval_id": approval.id}

@router.get("/tasks/{task_id}/logs")
def get_task_logs(
    task_id: str,
    db: Session = Depends(get_db)
):
    steps = db.query(AgentStepDB).filter(AgentStepDB.task_id == task_id).order_by(AgentStepDB.step_number).all()
    return [
        {
            "step": s.step_number,
            "type": s.step_type,
            "content": s.content,
            "created_at": s.created_at.isoformat() if s.created_at else None
        } for s in steps
    ]
