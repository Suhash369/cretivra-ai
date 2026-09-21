import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.database.models import ArtifactDB

class ArtifactService:
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = os.path.abspath(storage_dir or os.path.join(settings.UPLOAD_DIR, "artifacts"))
        os.makedirs(self.storage_dir, exist_ok=True)

    def create_artifact(
        self,
        db: Session,
        artifact_type: str,
        name: str,
        file_path: str,
        project_id: Optional[str] = None,
        run_id: Optional[str] = None,
        mime_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ArtifactDB:
        """
        Registers a generated file as a managed artifact.
        """
        size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        ext = os.path.splitext(name)[1].lower()
        
        detected_mime = mime_type or self._detect_mime(ext, artifact_type)
        rel_filename = os.path.basename(file_path)
        download_url = f"/api/artifacts/download/{rel_filename}"

        artifact = ArtifactDB(
            project_id=project_id,
            run_id=run_id,
            type=artifact_type.upper(),
            name=name,
            path=file_path,
            size=size,
            mime_type=detected_mime,
            download_url=download_url,
            metadata_json=metadata or {}
        )
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        logger.info(f"Registered artifact: {artifact.name} ({artifact.type}, {artifact.size} bytes)")
        return artifact

    def get_artifact(self, db: Session, artifact_id: str) -> Optional[ArtifactDB]:
        return db.query(ArtifactDB).filter(ArtifactDB.id == artifact_id).first()

    def list_artifacts(
        self,
        db: Session,
        project_id: Optional[str] = None,
        run_id: Optional[str] = None
    ) -> List[ArtifactDB]:
        q = db.query(ArtifactDB)
        if project_id:
            q = q.filter(ArtifactDB.project_id == project_id)
        if run_id:
            q = q.filter(ArtifactDB.run_id == run_id)
        return q.order_by(ArtifactDB.created_at.desc()).all()

    def _detect_mime(self, ext: str, artifact_type: str) -> str:
        mimes = {
            ".pdf": "application/pdf",
            ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".csv": "text/csv",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".json": "application/json",
            ".zip": "application/zip",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".html": "text/html",
            ".js": "application/javascript",
            ".ts": "application/typescript",
            ".tsx": "text/typescript",
            ".py": "text/x-python",
            ".md": "text/markdown"
        }
        return mimes.get(ext, "application/octet-stream")

artifact_service = ArtifactService()
