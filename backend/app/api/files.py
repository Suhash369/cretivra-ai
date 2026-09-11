import os
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.services.file_service import file_service
from app.services.presentation_service import presentation_service
from app.services.pdf_service import pdf_service
from app.core.config import settings
from app.core.security import sanitize_filename, validate_path_safety
from app.core.logging import logger

router = APIRouter(prefix="/files", tags=["Files"])

class ExportPdfRequest(BaseModel):
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Markdown or text content to render")
    subtitle: Optional[str] = Field(None, description="Optional document subtitle")

class GeneratePresentationRequest(BaseModel):
    title: str = Field(..., description="Presentation title")
    subtitle: Optional[str] = Field(None, description="Optional presentation subtitle")
    slides: List[Dict[str, Any]] = Field(..., description="List of slide objects with 'title' and 'bullets'")
    theme: Optional[str] = Field("modern-dark", description="Visual theme name (modern-dark, corporate-navy)")

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_file"
    file_bytes = await file.read()
    
    try:
        saved_info = await file_service.save_file(
            file_bytes=file_bytes,
            filename=filename,
            mime_type=file.content_type or "application/octet-stream"
        )
        return saved_info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error handling file upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during file processing.")

@router.get("/download/{filename}")
async def download_file(filename: str):
    """
    Secure file download endpoint for generated PowerPoint files and uploaded documents.
    """
    clean_name = sanitize_filename(filename)
    
    # Check in generated folder first
    gen_path = os.path.join(settings.UPLOAD_DIR, "generated", clean_name)
    upload_path = os.path.join(settings.UPLOAD_DIR, clean_name)

    target_path = None
    if os.path.exists(gen_path) and validate_path_safety(gen_path, os.path.join(settings.UPLOAD_DIR, "generated")):
        target_path = gen_path
    elif os.path.exists(upload_path) and validate_path_safety(upload_path, settings.UPLOAD_DIR):
        target_path = upload_path

    if not target_path or not os.path.isfile(target_path):
        raise HTTPException(status_code=404, detail="File not found or expired.")

    # Determine media type
    ext = os.path.splitext(clean_name)[1].lower()
    media_types = {
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=clean_name,
        headers={"Content-Disposition": f'attachment; filename="{clean_name}"'}
    )

@router.post("/generate-presentation")
async def generate_presentation_endpoint(request: GeneratePresentationRequest):
    """
    Generates a structured, professional 16:9 widescreen PowerPoint presentation (.pptx).
    """
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty.")

    try:
        res = presentation_service.generate_presentation(
            title=request.title,
            slides=request.slides,
            subtitle=request.subtitle,
            theme_name=request.theme or "modern-dark"
        )
        return res
    except Exception as e:
        logger.error(f"Error generating PowerPoint deck: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate presentation: {str(e)}")

@router.post("/export-pdf")
async def export_pdf_endpoint(request: ExportPdfRequest):
    """
    Generates a publication-grade, professionally formatted PDF document (.pdf).
    """
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty.")
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    try:
        res = pdf_service.generate_pdf(
            title=request.title,
            content=request.content,
            subtitle=request.subtitle
        )
        return res
    except Exception as e:
        logger.error(f"Error generating PDF document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
