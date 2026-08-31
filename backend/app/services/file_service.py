import os
import shutil
import uuid
from typing import Dict, Any, Optional
import pypdf
import docx
from app.core.config import settings
from app.core.security import sanitize_filename, validate_path_safety
from app.core.logging import logger

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".csv", ".md",
    ".png", ".jpg", ".jpeg", ".webp"
}

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "text/markdown": ".md",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp"
}

class FileService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = os.path.abspath(upload_dir)
        os.makedirs(self.upload_dir, exist_ok=True)

    def validate_file(self, filename: str, file_size: int) -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return {
                "valid": False,
                "error": f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            }
        
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            return {
                "valid": False,
                "error": f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            }

        return {"valid": True}

    async def save_file(self, file_bytes: bytes, filename: str, mime_type: str) -> Dict[str, Any]:
        validation = self.validate_file(filename, len(file_bytes))
        if not validation["valid"]:
            raise ValueError(validation["error"])

        clean_name = sanitize_filename(filename)
        file_id = str(uuid.uuid4())
        stored_filename = f"{file_id}_{clean_name}"
        file_path = os.path.join(self.upload_dir, stored_filename)

        if not validate_path_safety(file_path, self.upload_dir):
            raise ValueError("Invalid file path / potential path traversal detected.")

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Extract text content if document
        extracted_text = self.extract_text_content(file_path, clean_name)

        return {
            "id": file_id,
            "filename": clean_name,
            "mime_type": mime_type,
            "path": file_path,
            "size": len(file_bytes),
            "extracted_text": extracted_text
        }

    def extract_text_content(self, file_path: str, filename: str) -> Optional[str]:
        ext = os.path.splitext(filename)[1].lower()
        try:
            if ext in [".txt", ".md", ".csv"]:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()

            elif ext == ".pdf":
                reader = pypdf.PdfReader(file_path)
                text_pages = []
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text_pages.append(t)
                return "\n\n".join(text_pages)

            elif ext == ".docx":
                doc = docx.Document(file_path)
                return "\n".join([p.text for p in doc.paragraphs if p.text])

        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}")
        return None

file_service = FileService()
