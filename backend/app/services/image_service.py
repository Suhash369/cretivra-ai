import io
import re
import random
import urllib.parse
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image

class ImageService:
    """
    State-of-the-Art Image Generation Service for Asura AI by Cretivra.
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
        if aspect_ratio and aspect_ratio in self.ASPECT_RATIO_MAP:
            return self.ASPECT_RATIO_MAP[aspect_ratio]
        
        w = max(256, min(2048, width or 1024))
        h = max(256, min(2048, height or 1024))
        return (w, h)

    def resolve_engine(self, model_identifier: str) -> str:
        key = (model_identifier or "flux").strip().lower()
        return self.MODEL_ENGINE_MAP.get(key, "flux")

    def enhance_prompt(self, prompt: str, style: Optional[str] = None, model: Optional[str] = None) -> str:
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
        negative_prompt: Optional[str] = None,
        reference_image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds a high-definition AI image generation URL with multi-engine support and optional reference image.
        """
        clean_prompt = prompt.strip()
        actual_width, actual_height = self.resolve_dimensions(aspect_ratio, width, height)
        engine = self.resolve_engine(model)
        actual_seed = seed if (seed is not None and seed > 0) else random.randint(100000, 9999999)

        effective_prompt = clean_prompt
        if style:
            effective_prompt = self.enhance_prompt(clean_prompt, style=style, model=engine)

        # If a reference image is provided, append styling or remix parameters
        if reference_image and reference_image.strip():
            if not any(w in effective_prompt.lower() for w in ["remix", "variation", "style of"]):
                effective_prompt = f"{effective_prompt}, inspired by source composition, high visual fidelity"

        encoded_prompt = urllib.parse.quote(effective_prompt)

        # Base Pollinations FLUX generation URL
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={actual_width}&height={actual_height}&model={engine}&nologo=true&seed={actual_seed}"
        )

        # If a reference image URL is available (http/https), pass to the image parameter
        if reference_image and reference_image.startswith("http"):
            encoded_ref = urllib.parse.quote(reference_image)
            image_url += f"&image={encoded_ref}"

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
            "style": style,
            "reference_image": reference_image
        }

    def describe_image_for_prompt(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Analyzes an uploaded image to generate a rich, descriptive prompt for creative remixing.
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                w, h = img.size
                ratio_val = w / h
                if 0.95 <= ratio_val <= 1.05:
                    ratio_label = "1:1"
                elif ratio_val > 1.3:
                    ratio_label = "16:9"
                elif ratio_val < 0.75:
                    ratio_label = "9:16"
                else:
                    ratio_label = "4:3"

                # Analyze basic color/light profile
                img_rgb = img.convert("RGB")
                small = img_rgb.resize((32, 32))
                raw_bytes = small.tobytes()
                # 3 bytes per pixel (R, G, B)
                r_vals = raw_bytes[0::3]
                g_vals = raw_bytes[1::3]
                b_vals = raw_bytes[2::3]
                avg_r = sum(r_vals) / len(r_vals)
                avg_g = sum(g_vals) / len(g_vals)
                avg_b = sum(b_vals) / len(b_vals)
                brightness = (avg_r + avg_g + avg_b) / 3

                mood = "bright cinematic lighting" if brightness > 140 else "moody atmospheric lighting with deep shadows"
                color_tone = "warm golden tones" if avg_r > avg_b else "cool cybernetic tones"

                clean_name = re.sub(r"[-_.]+", " ", filename).strip()
                suggested_prompt = (
                    f"A stunning aesthetic scene of {clean_name}, {mood}, {color_tone}, "
                    f"intricate details, 8k resolution, masterful composition, artstation trending"
                )

                return {
                    "success": True,
                    "prompt": suggested_prompt,
                    "aspect_ratio": ratio_label,
                    "width": w,
                    "height": h,
                    "suggested_style": "photorealistic" if brightness > 120 else "cinematic"
                }
        except Exception as e:
            return {
                "success": False,
                "prompt": f"Artistic visual remix of {filename}, masterpiece, cinematic lighting, 8k detail",
                "aspect_ratio": "1:1",
                "suggested_style": "photorealistic"
            }

    def get_available_models(self) -> List[Dict[str, Any]]:
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
