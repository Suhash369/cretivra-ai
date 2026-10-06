import io
import re
import random
import base64
import urllib.parse
from PIL import Image
import httpx
from typing import Dict, Any, Optional, Tuple, List
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseImageGenerationProvider

class ImageGenerationProvider(BaseImageGenerationProvider):
    """
    Dedicated Image Generation Provider for Asura AI by Cretivra.
    Supports Google Gemini image generation API and clean FLUX / SDXL rendering engines.
    Always watermark-free and branded as Asura.
    """
    def __init__(self):
        self.enabled = getattr(settings, "IMAGE_GENERATION_ENABLED", True)
        self.provider = getattr(settings, "IMAGE_GENERATION_PROVIDER", "gemini")
        self.model = getattr(settings, "IMAGE_GENERATION_MODEL", "flux-realism")

    async def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        style: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates an artificial image from text prompt.
        Returns:
            {
                "success": bool,
                "url": str,
                "thumbnail": str,
                "prompt": str,
                "enhanced_prompt": str,
                "attribution": "Asura generated this image",
                "brand": "Cretivra Asura"
            }
        """
        if not self.enabled or not prompt or not prompt.strip():
            return {
                "success": False,
                "error": "Image generation is currently disabled or prompt was empty."
            }

        clean_prompt = prompt.strip()
        enhanced_prompt = clean_prompt
        if style:
            enhanced_prompt = f"{clean_prompt}, {style} aesthetic, high detail, masterpiece"

        # Aspect ratio mapping
        aspect_dims = {
            "1:1": (1024, 1024),
            "16:9": (1280, 720),
            "9:16": (720, 1280),
            "4:3": (1024, 768),
            "3:4": (768, 1024),
        }
        w, h = aspect_dims.get(aspect_ratio, (1024, 1024))
        seed = random.randint(1000, 9999999)

        # 1. Try Gemini Image Generation if configured and provider is gemini
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if self.provider == "gemini" and gemini_key:
            try:
                gemini_bytes = await self._generate_with_gemini(enhanced_prompt, aspect_ratio)
                if gemini_bytes:
                    b64 = base64.b64encode(gemini_bytes).decode("utf-8")
                    data_url = f"data:image/png;base64,{b64}"
                    return {
                        "success": True,
                        "url": data_url,
                        "thumbnail": data_url,
                        "prompt": clean_prompt,
                        "enhanced_prompt": enhanced_prompt,
                        "attribution": "Asura generated this image",
                        "brand": "Cretivra Asura"
                    }
            except Exception as e:
                logger.debug(f"Gemini image generation fallback notice: {e}")

        # 2. Resilient Ultra-High-Fidelity FLUX / SDXL Engine
        encoded_prompt = urllib.parse.quote(enhanced_prompt, safe='')
        target_engine = self.model or "flux-realism"
        pollinations_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={w}&height={h}&model={target_engine}&nologo=true&seed={seed}"
        )
        proxy_url = f"/api/images/proxy?url={urllib.parse.quote(pollinations_url, safe='')}"

        return {
            "success": True,
            "url": proxy_url,
            "raw_url": pollinations_url,
            "thumbnail": proxy_url,
            "prompt": clean_prompt,
            "enhanced_prompt": enhanced_prompt,
            "attribution": "Asura generated this image",
            "brand": "Cretivra Asura"
        }

    async def _generate_with_gemini(self, prompt: str, aspect_ratio: str = "1:1") -> Optional[bytes]:
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if not gemini_key:
            return None
        clean_key = re.sub(r'[\r\n\t ]+', '', gemini_key)
        models_to_try = [
            "gemini-2.5-flash-image",
            "gemini-3.1-flash-image",
            "gemini-2.0-flash-exp"
        ]
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"Generate a visual image of: {prompt}. High resolution, masterpiece, aspect ratio {aspect_ratio}, no watermarks."}
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"]
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in models_to_try:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for p in parts:
                                if "inlineData" in p:
                                    b64_data = p["inlineData"].get("data", "")
                                    if b64_data:
                                        return base64.b64decode(b64_data)
                except Exception:
                    continue
        return None

image_generation_provider = ImageGenerationProvider()
