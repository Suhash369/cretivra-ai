import os
import shutil
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import sanitize_filename, validate_path_safety
from app.core.logging import logger
from app.database.models import ProjectDB, ProjectFileDB, ProjectMemoryDB

class ProjectService:
    def __init__(self, projects_root: Optional[str] = None):
        self.projects_root = os.path.abspath(projects_root or os.path.join(settings.UPLOAD_DIR, "projects"))
        os.makedirs(self.projects_root, exist_ok=True)

    def create_project(
        self,
        db: Session,
        user_id: str,
        name: str,
        description: Optional[str] = None
    ) -> ProjectDB:
        project = ProjectDB(
            user_id=user_id,
            name=name,
            description=description
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Initialize physical sandbox directory
        sandbox_path = os.path.join(self.projects_root, project.id)
        os.makedirs(sandbox_path, exist_ok=True)
        project.root_path = sandbox_path
        db.commit()
        db.refresh(project)

        logger.info(f"Created project: {project.name} (id={project.id}) at {sandbox_path}")
        return project

    def get_project(self, db: Session, project_id: str, user_id: Optional[str] = None) -> Optional[ProjectDB]:
        q = db.query(ProjectDB).filter(ProjectDB.id == project_id)
        if user_id:
            q = q.filter(ProjectDB.user_id == user_id)
        return q.first()

    def list_projects(self, db: Session, user_id: str) -> List[ProjectDB]:
        return db.query(ProjectDB).filter(ProjectDB.user_id == user_id).order_by(ProjectDB.updated_at.desc()).all()

    def write_project_file(
        self,
        db: Session,
        project_id: str,
        rel_path: str,
        content: str,
        mime_type: str = "text/plain"
    ) -> ProjectFileDB:
        project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project or not project.root_path:
            raise ValueError(f"Project {project_id} not found or has no root path.")

        # Ensure safe relative path
        clean_rel_path = os.path.normpath(rel_path).lstrip("/\\")
        abs_file_path = os.path.abspath(os.path.join(project.root_path, clean_rel_path))
        
        if not validate_path_safety(abs_file_path, project.root_path):
            raise ValueError(f"Path traversal detected: {rel_path}")

        os.makedirs(os.path.dirname(abs_file_path), exist_ok=True)
        with open(abs_file_path, "w", encoding="utf-8") as f:
            f.write(content)

        file_size = len(content.encode("utf-8"))

        # Check if record already exists in DB
        existing_file = db.query(ProjectFileDB).filter(
            ProjectFileDB.project_id == project_id,
            ProjectFileDB.path == clean_rel_path
        ).first()

        if existing_file:
            existing_file.content = content
            existing_file.size = file_size
            existing_file.mime_type = mime_type
            existing_file.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_file)
            return existing_file

        new_file = ProjectFileDB(
            project_id=project_id,
            path=clean_rel_path,
            content=content,
            size=file_size,
            mime_type=mime_type
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        return new_file

    def read_project_file(self, db: Session, project_id: str, rel_path: str) -> Optional[str]:
        project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project or not project.root_path:
            return None

        clean_rel_path = os.path.normpath(rel_path).lstrip("/\\")
        abs_file_path = os.path.abspath(os.path.join(project.root_path, clean_rel_path))

        if not validate_path_safety(abs_file_path, project.root_path):
            return None

        if os.path.exists(abs_file_path) and os.path.isfile(abs_file_path):
            with open(abs_file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        return None

    def list_project_files(self, db: Session, project_id: str) -> List[Dict[str, Any]]:
        project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project or not project.root_path or not os.path.exists(project.root_path):
            return []

        tree = []
        for root, dirs, files in os.walk(project.root_path):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, project.root_path).replace("\\", "/")
                size = os.path.getsize(abs_path)
                tree.append({
                    "path": rel_path,
                    "name": file,
                    "size": size,
                    "ext": os.path.splitext(file)[1].lower()
                })
        return sorted(tree, key=lambda x: x["path"])

    def add_memory(
        self,
        db: Session,
        project_id: str,
        key: str,
        content: str,
        category: str = "requirement"
    ) -> ProjectMemoryDB:
        memory = ProjectMemoryDB(
            project_id=project_id,
            key=key,
            content=content,
            category=category
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)
        return memory

    def get_memories(self, db: Session, project_id: str) -> List[ProjectMemoryDB]:
        return db.query(ProjectMemoryDB).filter(ProjectMemoryDB.project_id == project_id).all()

project_service = ProjectService()
