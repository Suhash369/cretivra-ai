import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.artifact_service import artifact_service

router = APIRouter(prefix="/artifacts", tags=["Artifacts"])

@router.get("")
def list_artifacts(
    project_id: Optional[str] = None,
    run_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    artifacts = artifact_service.list_artifacts(db, project_id=project_id, run_id=run_id)
    return [
        {
            "id": a.id,
            "project_id": a.project_id,
            "run_id": a.run_id,
            "name": a.name,
            "type": a.type,
            "size": a.size,
            "mime_type": a.mime_type,
            "download_url": a.download_url,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in artifacts
    ]

@router.get("/{artifact_id}")
def get_artifact_detail(
    artifact_id: str,
    db: Session = Depends(get_db)
):
    art = artifact_service.get_artifact(db, artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found.")

    return {
        "id": art.id,
        "name": art.name,
        "type": art.type,
        "size": art.size,
        "mime_type": art.mime_type,
        "path": art.path,
        "download_url": art.download_url,
        "metadata": art.metadata_json,
        "created_at": art.created_at.isoformat() if art.created_at else None
    }

@router.get("/download/{filename}")
def download_artifact_file(filename: str):
    # Check in artifacts directory, uploads/generated directory, or project sandbox
    from app.core.config import settings
    search_dirs = [
        os.path.join(settings.UPLOAD_DIR, "artifacts"),
        os.path.join(settings.UPLOAD_DIR, "generated"),
        settings.UPLOAD_DIR
    ]

    for d in search_dirs:
        p = os.path.join(d, filename)
        if os.path.exists(p) and os.path.isfile(p):
            return FileResponse(p, filename=filename)

    raise HTTPException(status_code=404, detail=f"Artifact file '{filename}' not found.")
