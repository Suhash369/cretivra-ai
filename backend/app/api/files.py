from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.file_service import file_service
from app.core.logging import logger

router = APIRouter(prefix="/files", tags=["Files"])

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
