from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import UserDB
from app.api.auth import get_optional_user
from app.api.agents import get_current_or_guest_user
from app.services.project_service import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectFileWriteRequest(BaseModel):
    path: str
    content: str
    mime_type: Optional[str] = "text/plain"

@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreateRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required.")

    user = get_current_or_guest_user(db, current_user)
    proj = project_service.create_project(
        db=db,
        user_id=user.id,
        name=payload.name.strip(),
        description=payload.description
    )
    return {
        "id": proj.id,
        "name": proj.name,
        "description": proj.description,
        "root_path": proj.root_path,
        "created_at": proj.created_at.isoformat() if proj.created_at else None
    }

@router.get("")
def list_projects(
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user = get_current_or_guest_user(db, current_user)
    projs = project_service.list_projects(db, user.id)
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        } for p in projs
    ]

@router.get("/{project_id}")
def get_project(
    project_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user = get_current_or_guest_user(db, current_user)
    proj = project_service.get_project(db, project_id, user_id=user.id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")

    files = project_service.list_project_files(db, project_id)
    memories = project_service.get_memories(db, project_id)

    return {
        "id": proj.id,
        "name": proj.name,
        "description": proj.description,
        "root_path": proj.root_path,
        "created_at": proj.created_at.isoformat() if proj.created_at else None,
        "files": files,
        "memories": [{"key": m.key, "content": m.content, "category": m.category} for m in memories]
    }

@router.post("/{project_id}/files")
def write_project_file(
    project_id: str,
    payload: ProjectFileWriteRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user = get_current_or_guest_user(db, current_user)
    proj = project_service.get_project(db, project_id, user_id=user.id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")

    try:
        f = project_service.write_project_file(
            db=db,
            project_id=project_id,
            rel_path=payload.path,
            content=payload.content,
            mime_type=payload.mime_type or "text/plain"
        )
        return {"path": f.path, "size": f.size, "status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
