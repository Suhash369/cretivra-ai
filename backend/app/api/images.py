import re
from fastapi import APIRouter, HTTPException, UploadFile, File, Response, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["images"])

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Text description of the visual to generate")
    aspect_ratio: Optional[str] = Field("1:1", description="Aspect ratio preset: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9")
    width: Optional[int] = Field(None, ge=256, le=2048, description="Custom image width")
    height: Optional[int] = Field(None, ge=256, le=2048, description="Custom image height")
    model: str = Field("cretivra-flux", description="Image generation model ID or engine name")
    style: Optional[str] = Field(None, description="Visual aesthetic preset (photorealistic, cyberpunk, anime, 3d, fantasy, cinematic, minimalist)")
    enhance: bool = Field(True, description="Auto-enhance prompt quality")
    seed: Optional[int] = Field(None, description="Optional seed for deterministic reproducibility")
    negative_prompt: Optional[str] = Field(None, description="Keywords to avoid in generation")
    reference_image: Optional[str] = Field(None, description="Optional URL or base64 of reference image for remixing")

class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., description="Short prompt to enrich")
    style: Optional[str] = Field(None, description="Target aesthetic style")
    model: Optional[str] = Field("flux", description="Target engine")

@router.get("/models")
async def get_image_models():
    """
    Returns available Cretivra Image Studio engines and configuration parameters.
    """
    return {
        "models": image_service.get_available_models(),
        "aspect_ratios": list(image_service.ASPECT_RATIO_MAP.keys()),
        "styles": list(image_service.STYLE_PROMPT_MODIFIERS.keys())
    }

@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="Remote synthesis image URL to proxy safely"),
    download: Optional[bool] = Query(False, description="Whether to trigger file download attachment"),
    filename: Optional[str] = Query(None, description="Optional download filename")
):
    """
    Proxies visual media from synthesis engines to avoid client-side CORS,
    Cloudflare Turnstile token rejections on localhost, and adblocker issues.
    """
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid image URL.")

    data, content_type = await image_service.fetch_image_bytes(url)
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch synthesized image.")

    headers = {
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
    }
    if download:
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename or "cretivra-art")[:40]
        ext = "png" if "png" in content_type else "jpg"
        headers["Content-Disposition"] = f'attachment; filename="{clean_name}.{ext}"'

    return Response(content=data, media_type=content_type, headers=headers)

_gemini_image_cache: Dict[str, Tuple[bytes, str]] = {}

@router.get("/gemini/{image_id}")
async def get_gemini_image(
    image_id: str,
    download: Optional[bool] = Query(False),
    filename: Optional[str] = Query(None)
):
    """
    Serves native Google Gemini synthesized images with zero watermark.
    """
    if image_id not in _gemini_image_cache:
        raise HTTPException(status_code=404, detail="Synthesized visual expired or not found.")
    
    data, content_type = _gemini_image_cache[image_id]
    headers = {
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
    }
    if download:
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename or "gemini-visual")[:40]
        ext = "png" if "png" in content_type else "jpg"
        headers["Content-Disposition"] = f'attachment; filename="{clean_name}.{ext}"'

    return Response(content=data, media_type=content_type, headers=headers)

@router.post("/generate")
async def generate_image(request: ImageGenerateRequest):
    """
    Generate an AI Image using Google Gemini Vision/Imagen, FLUX.1, SDXL, Turbo, Anime, or 3D engine.
    Watermark-free visuals with multi-engine fallback.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    # 1. If Google Gemini model was selected, attempt native Gemini image generation
    if request.model in ["gemini", "cretivra-gemini"]:
        gemini_result = await image_service.generate_with_gemini(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio or "1:1"
        )
        if gemini_result:
            import uuid
            img_id = f"gemini_{uuid.uuid4().hex[:12]}"
            _gemini_image_cache[img_id] = gemini_result
            img_url = f"/api/images/gemini/{img_id}"
            return {
                "success": True,
                "prompt": request.prompt.strip(),
                "enhanced_prompt": request.prompt.strip(),
                "image_url": img_url,
                "proxy_url": img_url,
                "model": "gemini",
                "model_id": "cretivra-gemini",
                "provider": "Google Gemini Vision & Imagen (Zero Watermark)",
                "aspect_ratio": request.aspect_ratio or "1:1",
                "width": 1024,
                "height": 1024,
                "seed": request.seed or 42,
                "style": request.style,
                "reference_image": request.reference_image
            }

    # 2. Standard multi-engine generation with automatic watermark removal via proxy
    result = image_service.generate_image_url(
        prompt=request.prompt,
        aspect_ratio=request.aspect_ratio,
        width=request.width,
        height=request.height,
        model=request.model,
        style=request.style,
        enhance=request.enhance,
        seed=request.seed,
        negative_prompt=request.negative_prompt,
        reference_image=request.reference_image
    )
    return result

@router.post("/enhance-prompt")
async def enhance_prompt_endpoint(request: EnhancePromptRequest):
    """
    Expands a brief concept into a high-detail creative prompt for AI art synthesis.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    enhanced = image_service.enhance_prompt(
        prompt=request.prompt,
        style=request.style,
        model=request.model
    )
    return {
        "original_prompt": request.prompt,
        "enhanced_prompt": enhanced,
        "style": request.style
    }

@router.post("/describe")
async def describe_image_endpoint(file: UploadFile = File(...)):
    """
    Reverse-engineers an uploaded image into a high-detail creative prompt for AI remixing.
    """
    filename = file.filename or "image.png"
    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    description_result = await image_service.describe_image_for_prompt(file_bytes, filename)
    return description_result
