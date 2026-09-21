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

@router.get("/{artifact_id}/content")
def get_artifact_content(
    artifact_id: str,
    db: Session = Depends(get_db)
):
    from app.database.models import ArtifactDB, ProjectFileDB
    art = db.query(ArtifactDB).filter(ArtifactDB.id == artifact_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found.")

    # 1. From metadata if stored
    if art.metadata_json and isinstance(art.metadata_json, dict) and "content" in art.metadata_json:
        return {
            "content": art.metadata_json["content"],
            "mime_type": art.mime_type or "text/html",
            "name": art.name
        }

    # 2. From project file record
    if art.project_id:
        proj_file = db.query(ProjectFileDB).filter(
            ProjectFileDB.project_id == art.project_id,
            ProjectFileDB.path.like(f"%{art.name}")
        ).first()
        if proj_file and proj_file.content:
            return {
                "content": proj_file.content,
                "mime_type": proj_file.mime_type or "text/html",
                "name": art.name
            }

    # 3. From physical file path
    if art.path and os.path.exists(art.path) and os.path.isfile(art.path):
        try:
            with open(art.path, "r", encoding="utf-8", errors="replace") as f:
                return {
                    "content": f.read(),
                    "mime_type": art.mime_type or "text/html",
                    "name": art.name
                }
        except Exception:
            pass

    return {"content": "", "mime_type": art.mime_type or "text/plain", "name": art.name}

@router.get("/download/{filename}")
def download_artifact_file(filename: str, db: Session = Depends(get_db)):
    from app.core.config import settings
    from app.database.models import ArtifactDB, ProjectFileDB
    from fastapi.responses import Response

    # 1. Direct ArtifactDB lookup by id or exact name
    art = db.query(ArtifactDB).filter(
        (ArtifactDB.id == filename) |
        (ArtifactDB.name == filename)
    ).order_by(ArtifactDB.created_at.desc()).first()

    if art:
        if art.path and os.path.exists(art.path) and os.path.isfile(art.path):
            return FileResponse(art.path, filename=art.name, media_type=art.mime_type)
        if art.metadata_json and isinstance(art.metadata_json, dict) and "content" in art.metadata_json:
            return Response(content=art.metadata_json["content"], media_type=art.mime_type or "text/html")

    # 2. Direct ProjectFileDB lookup
    proj_file = db.query(ProjectFileDB).filter(
        (ProjectFileDB.path == filename) |
        (ProjectFileDB.path.like(f"%{filename}"))
    ).order_by(ProjectFileDB.created_at.desc()).first()

    if proj_file and proj_file.content:
        return Response(content=proj_file.content, media_type=proj_file.mime_type or "text/html")

    # 3. Recursive disk search
    search_dirs = [
        os.path.join(settings.UPLOAD_DIR, "artifacts"),
        os.path.join(settings.UPLOAD_DIR, "projects"),
        os.path.join(settings.UPLOAD_DIR, "generated"),
        settings.UPLOAD_DIR
    ]

    for d in search_dirs:
        if not os.path.exists(d):
            continue
        direct_p = os.path.join(d, filename)
        if os.path.exists(direct_p) and os.path.isfile(direct_p):
            return FileResponse(direct_p, filename=filename)
        for root, _, files in os.walk(d):
            if filename in files:
                found_p = os.path.join(root, filename)
                if os.path.isfile(found_p):
                    return FileResponse(found_p, filename=filename)

    raise HTTPException(status_code=404, detail=f"Artifact file '{filename}' not found.")
