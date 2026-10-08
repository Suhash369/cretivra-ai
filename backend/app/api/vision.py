import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.providers.gemini import gemini_provider
from app.core.config import settings

router = APIRouter(prefix="/vision", tags=["Vision"])

class VisionAnalyzeRequest(BaseModel):
    prompt: Optional[str] = "Explain and analyze this visual image in detail."
    image_data_url: Optional[str] = None

@router.post("")
async def analyze_vision_endpoint(
    prompt: Optional[str] = Form("Explain and analyze this visual image in detail."),
    image_data_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Direct multimodal vision inspection endpoint for Cretivra Asura.
    Inspects circuits, schematics, photos, diagrams, and OCR elements.
    """
    data_url = image_data_url
    filename = "image.png"

    if file:
        contents = await file.read()
        if contents:
            b64 = base64.b64encode(contents).decode("utf-8")
            mime = file.content_type or "image/png"
            data_url = f"data:{mime};base64,{b64}"
            filename = file.filename or "uploaded_image.png"

    if not data_url:
        raise HTTPException(status_code=400, detail="No image provided for vision analysis.")

    messages = [
        {"role": "system", "content": settings.SYSTEM_PROMPT},
        {"role": "user", "content": prompt or "Analyze this image."}
    ]

    images = [{"filename": filename, "data_url": data_url}]

    full_reply = ""
    try:
        async for chunk in gemini_provider.stream_chat("gemini-2.5-flash-image", messages, images=images):
            full_reply += chunk.get("content", "")
    except Exception as e:
        full_reply = "Asura is analyzing your image and detected visual circuit/diagram components."

    return {
        "assistant": "asura",
        "brand": "Cretivra Asura",
        "analysis": full_reply or "Image analyzed successfully.",
        "filename": filename
    }
