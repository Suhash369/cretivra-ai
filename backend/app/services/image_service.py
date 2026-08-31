import re
import random
import urllib.parse
from typing import Dict, Any, Optional, Tuple, List

class ImageService:
    """
    State-of-the-Art Image Generation Service for Cretivra AI.
    Supports FLUX.1, SDXL, Turbo, Anime, and 3D CGI rendering engines.
    100% Free, zero-cost, no API keys or local GPU overhead needed.
    """

    ASPECT_RATIO_MAP: Dict[str, Tuple[int, int]] = {
        "1:1": (1024, 1024),
        "16:9": (1280, 720),
        "9:16": (720, 1280),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
        "21:9": (1344, 576),
    }

    MODEL_ENGINE_MAP: Dict[str, str] = {
        "cretivra-flux": "flux",
        "flux": "flux",
        "cretivra-diffusion": "flux-realism",
        "flux-realism": "flux-realism",
        "diffusion": "flux-realism",
        "cretivra-turbo": "turbo",
        "turbo": "turbo",
        "cretivra-anime": "flux-anime",
        "flux-anime": "flux-anime",
        "anime": "flux-anime",
        "cretivra-3d": "flux-3d",
        "flux-3d": "flux-3d",
        "3d": "flux-3d",
    }

    STYLE_PROMPT_MODIFIERS: Dict[str, str] = {
        "photorealistic": "8k uhd, photorealistic, cinematic 35mm photography, high detail, studio lighting, hyperrealistic",
        "cinematic": "cinematic shot, epic lighting, film grain, dramatic atmosphere, anamorphic lens, 8k resolution",
        "cyberpunk": "cyberpunk style, glowing neon lights, futuristic cityscape, volumetric lighting, vibrant purple and cyan accents",
        "anime": "masterpiece anime artwork, Makoto Shinkai aesthetic, vibrant colors, expressive lighting, clean line art",
        "3d": "3D octane render, Unreal Engine 5, ray tracing, volumetric lighting, Pixar quality, smooth textures",
        "fantasy": "high fantasy illustration, magical ethereal atmosphere, glowing particles, detailed digital painting",
        "minimalist": "minimalist art, clean lines, elegant composition, subtle color palette, modern design",
        "digital-art": "digital concept art, intricate details, dynamic composition, trending on ArtStation",
    }

    IMAGE_TRIGGER_PATTERNS = [
        r"^generate\s+(?:(?:for\s+)?me\s+)?(?:an?\s+)?image(?:\s+of)?\s+(.+)",
        r"^create\s+(?:(?:for\s+)?me\s+)?(?:an?\s+)?image(?:\s+of)?\s+(.+)",
        r"^draw\s+(?:(?:for\s+)?me\s+)?(?:(?:an?\s+)?(?:picture|image|art|painting)\s+(?:of\s+)?)?(.+)",
        r"^make\s+(?:(?:for\s+)?me\s+)?(?:an?\s+)?image(?:\s+of)?\s+(.+)",
        r"^generate\s+(?:(?:for\s+)?me\s+)?picture(?:\s+of)?\s+(.+)",
        r"^paint\s+(?:(?:for\s+)?me\s+)?(?:(?:an?\s+)?(?:picture|image|art|painting)\s+(?:of\s+)?)?(.+)",
        r"^show\s+me\s+(?:an?\s+)?(?:picture|image|visual|photo)(?:\s+of)?\s+(.+)",
        r"^render\s+(?:(?:for\s+)?me\s+)?(?:(?:a\s+)?(?:3d\s+)?(?:image|scene|picture)\s+(?:of\s+)?)?(.+)",
        r"^visualize\s+(.+)",
        r"^photo\s+of\s+(.+)",
        r"^picture\s+of\s+(.+)",
        r"^image:\s*(.+)",
        r"^/image\s+(.+)",
        r"^/draw\s+(.+)",
        r"^/art\s+(.+)",
        r"^/flux\s+(.+)",
    ]

    def detect_image_intent(self, text: str) -> Optional[str]:
        """
        Detects if the user prompt is requesting image generation.
        Returns the cleaned prompt string if detected, otherwise None.
        """
        trimmed = text.strip()
        for pattern in self.IMAGE_TRIGGER_PATTERNS:
            match = re.search(pattern, trimmed, re.IGNORECASE)
            if match:
                extracted = match.group(1).strip()
                if extracted:
                    return extracted
        return None

    def resolve_dimensions(
        self,
        aspect_ratio: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> Tuple[int, int]:
        """
        Resolves width and height from aspect ratio or custom dimensions.
        """
        if aspect_ratio and aspect_ratio in self.ASPECT_RATIO_MAP:
            return self.ASPECT_RATIO_MAP[aspect_ratio]
        
        w = max(256, min(2048, width or 1024))
        h = max(256, min(2048, height or 1024))
        return (w, h)

    def resolve_engine(self, model_identifier: str) -> str:
        """
        Maps Cretivra model IDs or short names to the backend generation engine.
        """
        key = (model_identifier or "flux").strip().lower()
        return self.MODEL_ENGINE_MAP.get(key, "flux")

    def enhance_prompt(self, prompt: str, style: Optional[str] = None, model: Optional[str] = None) -> str:
        """
        Enriches user prompt with high-detail stylistic keywords.
        """
        clean = prompt.strip()
        additions: List[str] = []

        if style and style.lower() in self.STYLE_PROMPT_MODIFIERS:
            additions.append(self.STYLE_PROMPT_MODIFIERS[style.lower()])
        elif model:
            eng = self.resolve_engine(model)
            if eng == "flux-anime" and "anime" not in clean.lower():
                additions.append("masterpiece anime visual, crisp digital art")
            elif eng == "flux-3d" and "3d" not in clean.lower():
                additions.append("3D Octane render, raytracing, cinematic lighting")
            elif eng == "flux-realism" and "photo" not in clean.lower():
                additions.append("photorealistic 8k uhd, 35mm lens, natural studio lighting")

        if additions:
            return f"{clean}, {', '.join(additions)}"
        return clean

    def generate_image_url(
        self,
        prompt: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        aspect_ratio: Optional[str] = "1:1",
        model: str = "flux",
        style: Optional[str] = None,
        enhance: bool = True,
        seed: Optional[int] = None,
        negative_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds a high-definition AI image generation URL with multi-engine support.
        """
        clean_prompt = prompt.strip()
        actual_width, actual_height = self.resolve_dimensions(aspect_ratio, width, height)
        engine = self.resolve_engine(model)
        actual_seed = seed if (seed is not None and seed > 0) else random.randint(100000, 9999999)

        effective_prompt = clean_prompt
        if style:
            effective_prompt = self.enhance_prompt(clean_prompt, style=style, model=engine)

        encoded_prompt = urllib.parse.quote(effective_prompt)

        # Base Pollinations FLUX generation URL
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={actual_width}&height={actual_height}&model={engine}&nologo=true&seed={actual_seed}"
        )

        if enhance:
            image_url += "&enhance=true"

        if negative_prompt and negative_prompt.strip():
            encoded_neg = urllib.parse.quote(negative_prompt.strip())
            image_url += f"&negative={encoded_neg}"

        return {
            "success": True,
            "prompt": clean_prompt,
            "enhanced_prompt": effective_prompt,
            "image_url": image_url,
            "model": engine,
            "model_id": model,
            "aspect_ratio": aspect_ratio or f"{actual_width}:{actual_height}",
            "width": actual_width,
            "height": actual_height,
            "seed": actual_seed,
            "style": style
        }

    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Returns metadata on available image generation engines.
        """
        return [
            {
                "id": "cretivra-flux",
                "engine": "flux",
                "name": "Cretivra FLUX.1 Art",
                "description": "Next-gen photorealism and fine digital art",
                "badge": "FLUX.1",
                "is_default": True
            },
            {
                "id": "cretivra-diffusion",
                "engine": "flux-realism",
                "name": "Cretivra SDXL Studio",
                "description": "Cinematic lighting and realistic portraits",
                "badge": "SDXL Realism",
                "is_default": False
            },
            {
                "id": "cretivra-turbo",
                "engine": "turbo",
                "name": "Cretivra Turbo Visuals",
                "description": "Ultra-fast instant image synthesis",
                "badge": "Turbo Speed",
                "is_default": False
            },
            {
                "id": "cretivra-anime",
                "engine": "flux-anime",
                "name": "Cretivra Anime Studio",
                "description": "Anime, manga, and stylized Japanese art",
                "badge": "Anime Art",
                "is_default": False
            },
            {
                "id": "cretivra-3d",
                "engine": "flux-3d",
                "name": "Cretivra 3D & CGI",
                "description": "Octane render, 3D CGI, and Unreal Engine visual aesthetics",
                "badge": "3D Octane",
                "is_default": False
            }
        ]

image_service = ImageService()
