from fastapi import APIRouter, HTTPException
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

@router.post("/generate")
async def generate_image(request: ImageGenerateRequest):
    """
    Generate an AI Image using Cretivra FLUX.1, SDXL, Turbo, Anime, or 3D engine.
    100% Free ($0.00 cost, zero API keys required).
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    result = image_service.generate_image_url(
        prompt=request.prompt,
        aspect_ratio=request.aspect_ratio,
        width=request.width,
        height=request.height,
        model=request.model,
        style=request.style,
        enhance=request.enhance,
        seed=request.seed,
        negative_prompt=request.negative_prompt
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
