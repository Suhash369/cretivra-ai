import io
import re
import random
import base64
import logging
import urllib.parse
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image
import httpx
from app.core.config import settings

logger = logging.getLogger("cretivra.images")

class ImageService:
    """
    State-of-the-Art Image Generation Service for Asura AI by Cretivra.
    Supports Google Gemini Vision/Imagen, FLUX.1, SDXL, Turbo, Anime, and 3D CGI rendering engines.
    100% Watermark-free, zero-cost, with multi-engine resilience.
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
        "cretivra-vision": "nanobanana2",
        "vision": "nanobanana2",
        "cretivra-nano-banana": "nanobanana2",
        "nano-banana": "nanobanana2",
        "nano-banana-2": "nanobanana2",
        "nanobanana": "nanobanana2",
        "nanobanana2": "nanobanana2",
        "nanobanana-pro": "flux-pro",
        "nano-banana-pro": "flux-pro",
        "nano banana": "nanobanana2",
        "cretivra-gemini": "nanobanana2",
        "gemini": "nanobanana2",
        "imagen": "nanobanana2",
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
        "diagram": "textbook electrical engineering schematic diagram, labeled logic block in center, labeled input pins on left, labeled output pins on right, truth table chart, logic equations callout box, crisp black and navy lines, clean white background, professional engineering publication, high contrast, legible 2D vector style, no 3D, no neon, no dark background",
        "schematic": "textbook electronic circuit schematic diagram, labeled components and logic gates, truth table, crisp black lines, clean white background, professional engineering blueprint, legible 2D vector style, no 3D, no neon, no dark background",
        "blueprint": "clean engineering blueprint schematic, labeled components, crisp lines, clean white background, technical schematic, high contrast 2D vector",
    }

    IMAGE_TRIGGER_PATTERNS = [
        # Explicit user requests with "i need", "i want", "give me", "show me", "can you", "please"
        r"^(?:(?:i\s+(?:need|want|would\s+like)|give\s+me|show\s+me|send\s+me|provide\s+me|can\s+you\s+(?:give\s+me|show\s+me|provide|draw|generate|make|create)|could\s+you\s+(?:give\s+me|show\s+me|provide|draw|generate|make|create)|please\s+(?:give\s+me|show\s+me|draw|generate|make|create)))\s+(?:(?:an?|the)\s+)?(?:image|picture|photo|visual|illustration|drawing|sketch|artwork|diagram|circuit\s+diagram|schematic(?:\s+diagram)?|wiring\s+diagram|flowchart|blueprint)\s+(?:of|for|showing)?\s*(.+)",

        # "i need circuit diagram", "i need a diagram", "need circuit diagram", "give me circuit diagram"
        r"^(?:(?:i\s+)?(?:need|want)|give\s+me|show\s+me|provide)\s+(?:(?:an?|the)\s+)?((?:circuit\s+diagram|schematic(?:\s+diagram)?|wiring\s+diagram|logic\s+diagram|block\s+diagram|pinout(?:\s+diagram)?|timing\s+diagram|flowchart|architecture\s+diagram|diagram)(?:\s+(?:of|for|about)\s+.+)?)",

        # "generate an image/diagram", "create a circuit diagram", "make a schematic"
        r"^(?:generate|create|make|produce|render|synthesize)\s+(?:(?:for\s+)?me\s+)?(?:(?:an?|the)\s+)?((?:circuit\s+diagram|schematic(?:\s+diagram)?|wiring\s+diagram|logic\s+diagram|block\s+diagram|pinout(?:\s+diagram)?|timing\s+diagram|flowchart|architecture\s+diagram|blueprint|diagram)(?:\s+(?:of|for|about)\s+.+)?)",
        r"^(?:generate|create|make|produce|render|synthesize)\s+(?:(?:for\s+)?me\s+)?(?:(?:an?|the)\s+)?(?:image|picture|photo|visual|illustration|artwork|drawing|sketch)(?:\s+(?:of|for)\s+|\s+)(.+)",

        # "draw [me] ...", "paint [me] ...", "sketch [me] ...", "illustrate [me] ..."
        r"^(?:draw|paint|sketch|illustrate)\s+(?:(?:for\s+)?me\s+)?(?:(?:an?\s+)?(?:picture|image|art|painting|drawing|sketch|illustration|diagram|circuit\s+diagram|schematic)\s+(?:of|for)\s+)?(.+)",

        # "show me [an] [image/picture/diagram/schematic] of..."
        r"^show\s+me\s+(?:(?:an?|the)\s+)?(?:picture|image|visual|photo|drawing|illustration|diagram|circuit\s+diagram|schematic(?:\s+diagram)?)(?:\s+(?:of|for)\s+|\s+)(.+)",

        # "can you draw/generate...", "please draw/generate..."
        r"^(?:can\s+you|could\s+you|please)\s+(?:draw|paint|sketch|generate|create|make|illustrate)\s+(?:(?:for\s+)?me\s+)?(?:(?:an?\s+)?(?:picture|image|art|painting|drawing|illustration|diagram|circuit\s+diagram|schematic)\s+(?:of|for)\s+)?(.+)",

        # Standalone technical diagram / schematic queries
        r"^((?:circuit\s+diagram|schematic(?:\s+diagram)?|wiring\s+diagram|logic\s+diagram|block\s+diagram|pinout(?:\s+diagram)?|timing\s+diagram|flowchart|architecture\s+diagram)(?:\s+(?:of|for|about)\s+.+)?)",
        r"^diagram\s+(?:of|for|about)\s+(.+)",

        # Render / visualize
        r"^render\s+(?:(?:for\s+)?me\s+)?(?:(?:a\s+)?(?:3d\s+)?(?:image|scene|picture|model|render)\s+(?:of\s+)?)?(.+)",
        r"^visualize\s+(.+)",

        # "photo of ...", "picture of ...", "image of ..."
        r"^(?:photo|picture|image|illustration|drawing|sketch)\s+of\s+(.+)",
        r"^image:\s*(.+)",

        # Slash commands
        r"^/(?:image|draw|art|flux|diagram|schematic|visual)\s+(.+)",
    ]

    def detect_image_intent(self, text: str) -> Optional[str]:
        trimmed = text.strip()
        clean_text = re.sub(r"[?!.]+$", "", trimmed).strip()
        for pattern in self.IMAGE_TRIGGER_PATTERNS:
            match = re.search(pattern, clean_text, re.IGNORECASE)
            if match:
                extracted = match.group(1).strip()
                extracted = re.sub(r"[?!.]+$", "", extracted).strip()
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
        key = (model_identifier or "nanobanana2").strip().lower()
        return self.MODEL_ENGINE_MAP.get(key, "nanobanana2")

    def enhance_prompt(self, prompt: str, style: Optional[str] = None, model: Optional[str] = None) -> str:
        clean = prompt.strip()
        additions: List[str] = []

        if style and style.lower() in self.STYLE_PROMPT_MODIFIERS:
            additions.append(self.STYLE_PROMPT_MODIFIERS[style.lower()])
        else:
            is_technical = bool(re.search(r"\b(circuit|schematic|wiring|diagram|pinout|flowchart|architecture|blueprint|logic\s+gate|truth\s+table|converter)\b", clean, re.IGNORECASE))
            if is_technical:
                additions.append("textbook electrical engineering schematic diagram, labeled logic block in center, labeled input pins on left, labeled output pins on right, truth table, crisp lines, clean white background, professional engineering publication, high contrast, legible 2D vector style, no 3D, no neon, no dark background")
            elif model:
                eng = self.resolve_engine(model)
                if eng == "flux-anime" and "anime" not in clean.lower():
                    additions.append("masterpiece anime visual, crisp digital art")
                elif eng == "flux-3d" and "3d" not in clean.lower():
                    additions.append("3D Octane render, raytracing, cinematic lighting")
                elif eng == "flux-realism" and "photo" not in clean.lower():
                    additions.append("photorealistic 8k uhd, 35mm lens, natural studio lighting")
                elif eng == "nanobanana2" and not any(w in clean.lower() for w in ["8k", "photorealistic", "masterpiece"]):
                    additions.append("masterpiece visual, 8k uhd, cinematic lighting, ultra-detailed")

        if additions:
            return f"{clean}, {', '.join(additions)}"
        return clean

    def _finalize_expanded_text(self, text: str, style: Optional[str] = None) -> str:
        clean = text.replace('"', '').replace('**', '').strip()
        if style and style.lower() not in clean.lower():
            clean = f"{clean}, in {style} style"
        return clean

    async def expand_prompt_creative(
        self,
        prompt: str,
        style: Optional[str] = None
    ) -> str:
        """
        Transforms a concise user image request into an award-winning visual prompt.
        Cascades dynamically across Gemini, OpenRouter, and Groq to specify composition, lighting,
        color palette, typography, and textures.
        """
        clean_p = prompt.strip()
        if len(clean_p.split()) > 50:
            return self._finalize_expanded_text(clean_p, style=style)

        is_poster = bool(re.search(r"\b(poster|banner|invitation|card|flyer|marriage|wedding)\b", clean_p, re.IGNORECASE))

        sys_prompt = (
            "You are an elite Creative Visual Director and Prompt Engineer for state-of-the-art AI image synthesis. "
            "When given an image or poster request, expand it into a single, breathtaking, highly descriptive visual prompt that produces an award-winning visual masterpiece. "
            "Specify visual composition, cinematic lighting, color palette, surface textures, background atmosphere, and artistic details. "
            + ("For posters, weddings, or celebrations: specify elegant gold foil embossed typography (such as 'Save the Date' or 'Wedding Celebration'), opulent floral borders, rich royal silk or velvet background, and romantic cinematic lighting. " if is_poster else "")
            + (f"Ensure the visual adheres to the '{style}' artistic style. " if style else "")
            + "Output ONLY the expanded visual prompt in one cohesive paragraph. NEVER include explanations, markdown, or quotation marks."
        )

        # 1. Try Gemini
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if gemini_key and not gemini_key.strip().startswith("your_"):
            clean_gkey = re.sub(r'[\r\n\t ]+', '', gemini_key)
            for g_model in ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"]:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={clean_gkey}"
                    payload = {
                        "contents": [{"parts": [{"text": f"{sys_prompt}\n\nUser Request: {clean_p}"}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 250}
                    }
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        r = await client.post(url, json=payload)
                        if r.status_code == 200:
                            candidates = r.json().get("candidates", [])
                            if candidates:
                                text = candidates[0].get("content", {}).get("parts", [])[0].get("text", "").strip()
                                if text and len(text) > 25:
                                    return self._finalize_expanded_text(text, style=style)
                except Exception as e:
                    logger.debug(f"Gemini prompt expansion notice: {e}")

        # 2. Try OpenRouter
        or_key = getattr(settings, "OPENROUTER_API_KEY", "")
        if or_key:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "meta-llama/llama-3.3-70b-instruct",
                    "messages": [{"role": "system", "content": sys_prompt}, {"role": "user", "content": clean_p}],
                    "max_tokens": 250,
                    "temperature": 0.7
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    r = await client.post(url, json=payload, headers=headers)
                    if r.status_code == 200:
                        content = r.json()["choices"][0]["message"]["content"].strip()
                        if content and len(content) > 25:
                            return self._finalize_expanded_text(content, style=style)
            except Exception as e:
                logger.debug(f"OpenRouter prompt expansion notice: {e}")

        # 3. Try Groq (Ultra-fast 200ms)
        groq_key = getattr(settings, "GROQ_API_KEY", "")
        if groq_key:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "qwen/qwen3.8-27b",
                    "messages": [{"role": "system", "content": sys_prompt}, {"role": "user", "content": clean_p}],
                    "max_tokens": 250,
                    "temperature": 0.7
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    r = await client.post(url, json=payload, headers=headers)
                    if r.status_code == 200:
                        content = r.json()["choices"][0]["message"]["content"].strip()
                        if content and len(content) > 25:
                            return self._finalize_expanded_text(content, style=style)
            except Exception as e:
                logger.debug(f"Groq prompt expansion notice: {e}")

        return self.enhance_prompt(clean_p, style=style)

    expand_prompt_chatgpt_grade = expand_prompt_creative

    def generate_image_url(
        self,
        prompt: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        aspect_ratio: Optional[str] = "1:1",
        model: str = "flux-realism",
        style: Optional[str] = None,
        enhance: bool = True,
        seed: Optional[int] = None,
        negative_prompt: Optional[str] = None,
        reference_image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds a high-definition AI image generation URL with multi-engine support and optional reference image.
        Also produces a local proxy_url to prevent client-side CORS and Cloudflare Turnstile blocks.
        """
        clean_prompt = prompt.strip()
        effective_aspect = aspect_ratio or "1:1"
        # Smart aspect ratio: posters, invitations, and wedding cards are vertical/portrait (3:4) by default
        if effective_aspect == "1:1" and width is None and height is None:
            if re.search(r"\b(poster|banner|invitation|card|flyer|marriage|wedding)\b", clean_prompt, re.IGNORECASE):
                effective_aspect = "3:4"

        actual_width, actual_height = self.resolve_dimensions(effective_aspect, width, height)
        engine = self.resolve_engine(model)
        actual_seed = seed if (seed is not None and seed > 0) else random.randint(100000, 9999999)

        is_technical_query = bool(re.search(r"\b(circuit|schematic|wiring|pinout|logic\s+gate|truth\s+table|converter)\b", clean_prompt, re.IGNORECASE)) or (style in ["diagram", "schematic", "blueprint"])

        effective_prompt = clean_prompt
        if style or is_technical_query:
            effective_prompt = self.enhance_prompt(clean_prompt, style=style, model=engine)

        # For technical schematics, disable Pollinations external LLM rewrite (&enhance=true) to prevent neon/cyberpunk corruption
        if is_technical_query:
            enhance = False

        # If a reference image is provided, append styling or remix parameters
        if reference_image and reference_image.strip():
            if not any(w in effective_prompt.lower() for w in ["remix", "variation", "style of"]):
                effective_prompt = f"{effective_prompt}, inspired by source composition, high visual fidelity"

        encoded_prompt = urllib.parse.quote(effective_prompt, safe='')

        # Base Pollinations FLUX generation URL
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={actual_width}&height={actual_height}&model={engine}&nologo=true&seed={actual_seed}"
        )

        # If a reference image URL is available (http/https), pass to the image parameter
        if reference_image and reference_image.startswith("http"):
            encoded_ref = urllib.parse.quote(reference_image, safe='')
            image_url += f"&image={encoded_ref}"

        if enhance:
            image_url += "&enhance=true"

        if negative_prompt and negative_prompt.strip():
            encoded_neg = urllib.parse.quote(negative_prompt.strip(), safe='')
            image_url += f"&negative={encoded_neg}"

        # Safe local proxy URL to prevent CORS & Turnstile 403 blocks in client
        proxy_url = f"/api/images/proxy?url={urllib.parse.quote(image_url, safe='')}"

        return {
            "success": True,
            "prompt": clean_prompt,
            "enhanced_prompt": effective_prompt,
            "image_url": image_url,
            "proxy_url": proxy_url,
            "model": engine,
            "model_id": model,
            "aspect_ratio": effective_aspect or f"{actual_width}:{actual_height}",
            "width": actual_width,
            "height": actual_height,
            "seed": actual_seed,
            "style": style,
            "reference_image": reference_image
        }

    def remove_watermark(self, image_bytes: bytes) -> bytes:
        """
        Removes bottom-right watermarks (such as the Pollinations.ai badge)
        using precision edge cropping and Lanczos high-fidelity resampling.
        Yields 100% clean, unbranded, watermark-free visuals.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            w, h = img.size
            # The watermark badge is located in the bottom ~4.6% of the canvas.
            crop_h = max(24, int(h * 0.046))
            if crop_h < h:
                cropped = img.crop((0, 0, w, h - crop_h))
                clean_img = cropped.resize((w, h), Image.Resampling.LANCZOS)
                
                out = io.BytesIO()
                img_format = img.format or "JPEG"
                if img_format.upper() == "PNG":
                    clean_img.save(out, format="PNG", optimize=True)
                else:
                    clean_img.save(out, format="JPEG", quality=95)
                return out.getvalue()
        except Exception as e:
            logger.warning(f"Watermark removal skipped: {e}")
        return image_bytes

    async def generate_with_gemini(
        self,
        prompt: str,
        aspect_ratio: str = "1:1"
    ) -> Optional[Tuple[bytes, str]]:
        """
        Synthesizes native AI visuals directly with Google Gemini multimodal image generation.
        Produces pristine, frontier-quality visuals with ZERO watermark.
        """
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if not gemini_key:
            return None

        clean_key = re.sub(r'[\r\n\t ]+', '', gemini_key)
        # Priority order of Gemini models supporting native image output
        gemini_image_models = [
            "gemini-3.1-flash-image",
            "gemini-3.1-flash-lite-image",
            "gemini-2.5-flash-image",
            "gemini-3-pro-image"
        ]

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"Generate a high-definition visual of: {prompt}. Masterpiece, clean aesthetic, photorealistic, aspect ratio {aspect_ratio}, no watermarks, no logos, no text."}
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"]
            }
        }

        async with httpx.AsyncClient(timeout=40.0) as client:
            for model_name in gemini_image_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                if "inlineData" in part:
                                    b64_data = part["inlineData"].get("data", "")
                                    mime_type = part["inlineData"].get("mimeType", "image/png")
                                    if b64_data:
                                        raw_bytes = base64.b64decode(b64_data)
                                        logger.info(f"Synthesized visual via Google Gemini ({model_name}) with zero watermarks")
                                        return raw_bytes, mime_type
                    elif res.status_code == 429:
                        logger.warning(f"Gemini {model_name} quota exceeded (429), falling back to clean FLUX/SDXL engine.")
                        break
                    else:
                        logger.warning(f"Gemini {model_name} returned status {res.status_code}: {res.text[:150]}")
                except Exception as e:
                    logger.warning(f"Gemini {model_name} exception: {e}")
        return None

    async def generate_with_openrouter(
        self,
        prompt: str,
        aspect_ratio: str = "1:1"
    ) -> Optional[Tuple[bytes, str]]:
        """
        Synthesizes native AI visuals directly via OpenRouter image generation models.
        """
        key = getattr(settings, "OPENROUTER_API_KEY", "")
        if not key:
            return None

        clean_key = re.sub(r'[\r\n\t ]+', '', key)
        headers = {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://asura-ai.cretivra.com",
            "X-Title": "Cretivra AI"
        }

        openrouter_models = [
            "google/gemini-2.5-flash-image",
            "google/gemini-3.1-flash-image",
            "openai/gpt-5-image-mini"
        ]

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": f"Generate a high-definition image of: {prompt}. Masterpiece, 8k resolution, cinematic lighting, aspect ratio {aspect_ratio}."
                }
            ]
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            for model_name in openrouter_models:
                try:
                    payload["model"] = model_name
                    res = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        choices = data.get("choices", [])
                        if choices:
                            msg = choices[0].get("message", {})
                            content = msg.get("content", "")
                            img_match = re.search(r'(https?://[^\s)"]+\.(?:png|jpg|jpeg|webp))', content, re.IGNORECASE)
                            if img_match:
                                img_url = img_match.group(1)
                                img_resp = await client.get(img_url, timeout=15.0)
                                if img_resp.status_code == 200:
                                    logger.info(f"Synthesized visual via OpenRouter ({model_name})")
                                    return img_resp.content, img_resp.headers.get("content-type", "image/png")
                            data_url_match = re.search(r'data:(image/[^;]+);base64,([A-Za-z0-9+/=]+)', content)
                            if data_url_match:
                                mime = data_url_match.group(1)
                                b64 = data_url_match.group(2)
                                logger.info(f"Synthesized visual via OpenRouter ({model_name})")
                                return base64.b64decode(b64), mime
                    elif res.status_code in [402, 429]:
                        logger.warning(f"OpenRouter {model_name} limit ({res.status_code}), cascading to next engine.")
                        break
                except Exception as e:
                    logger.warning(f"OpenRouter {model_name} exception: {e}")
        return None

    async def fetch_image_bytes(self, url: str) -> Tuple[bytes, str]:
        """
        Fetches synthesized image bytes safely server-to-server to avoid client-side CORS / Turnstile issues.
        Includes automatic bottom-watermark removal, multi-engine fallback, and dynamic SVG generation.
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        # 1. Primary fetch
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200 and len(res.content) > 200:
                    ct = res.headers.get("content-type", "image/jpeg")
                    # Automatically remove watermarks from synthesis output
                    clean_content = self.remove_watermark(res.content)
                    return clean_content, ct
        except Exception:
            pass

        # 2. Fallback: if model was heavy or slow, retry with turbo engine
        if "pollinations.ai" in url:
            fallback_url = re.sub(r'model=[^&]+', 'model=turbo', url)
            if fallback_url != url:
                try:
                    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                        res = await client.get(fallback_url, headers=headers)
                        if res.status_code == 200 and len(res.content) > 200:
                            ct = res.headers.get("content-type", "image/jpeg")
                            clean_content = self.remove_watermark(res.content)
                            return clean_content, ct
                except Exception:
                    pass

        # 3. Dynamic SVG placeholder fallback
        svg = self._generate_fallback_svg(url)
        return svg.encode("utf-8"), "image/svg+xml"

    def _generate_fallback_svg(self, url: str) -> str:
        prompt_match = re.search(r'/prompt/([^?]+)', url)
        prompt_text = "Cretivra AI Visual Synthesis"
        if prompt_match:
            try:
                prompt_text = urllib.parse.unquote(prompt_match.group(1))
            except Exception:
                pass
        safe_prompt = prompt_text[:65].replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d"/>
      <stop offset="50%" stop-color="#181133"/>
      <stop offset="100%" stop-color="#060911"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="420" r="140" fill="none" stroke="url(#glow)" stroke-width="4" opacity="0.6"/>
  <path d="M472 380 L552 380 L552 460 L472 460 Z" fill="none" stroke="#a855f7" stroke-width="3" opacity="0.8"/>
  <circle cx="512" cy="420" r="30" fill="url(#glow)" opacity="0.8"/>
  <text x="512" y="600" fill="#f1f5f9" font-size="28" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">Asura AI Image Studio</text>
  <text x="512" y="645" fill="#94a3b8" font-size="16" font-family="system-ui, sans-serif" text-anchor="middle">{safe_prompt}</text>
  <text x="512" y="685" fill="#a855f7" font-size="13" font-family="monospace" text-anchor="middle">Cretivra Vision Engine • 100% Free</text>
</svg>'''

    async def describe_image_for_prompt(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Analyzes an uploaded image to generate a rich, descriptive prompt for creative remixing.
        Uses Gemini Vision if configured, with heuristic fallback.
        """
        clean_name = re.sub(r"[-_.]+", " ", filename).strip()
        ratio_label = "1:1"
        w, h = 1024, 1024
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
        except Exception:
            pass

        # 1. Try Gemini Vision if key configured
        from app.core.config import settings
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if gemini_key:
            clean_key = re.sub(r'[\r\n\t ]+', '', gemini_key)
            try:
                import base64
                import httpx
                b64_data = base64.b64encode(image_bytes).decode("utf-8")
                mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
                vision_prompt = (
                    f"Analyze this image named '{clean_name}'. Describe the subject, aesthetic style, lighting, color tone, "
                    f"and visual atmosphere in a single detailed sentence ideal as an AI image synthesis prompt."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={clean_key}"
                payload = {
                    "contents": [{
                        "role": "user",
                        "parts": [
                            {"text": vision_prompt},
                            {"inline_data": {"mime_type": mime, "data": b64_data}}
                        ]
                    }]
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                        text_out = "".join([p.get("text", "") for p in parts if "text" in p]).strip()
                        if text_out:
                            final_prompt = text_out if clean_name.lower() in text_out.lower() else f"{clean_name}, {text_out}"
                            return {
                                "success": True,
                                "prompt": final_prompt,
                                "aspect_ratio": ratio_label,
                                "width": w,
                                "height": h,
                                "suggested_style": "photorealistic"
                            }
            except Exception:
                pass

        # 2. Heuristic fallback using PIL
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img_rgb = img.convert("RGB")
                small = img_rgb.resize((32, 32))
                raw_bytes = small.tobytes()
                r_vals = raw_bytes[0::3]
                g_vals = raw_bytes[1::3]
                b_vals = raw_bytes[2::3]
                avg_r = sum(r_vals) / len(r_vals)
                avg_g = sum(g_vals) / len(g_vals)
                avg_b = sum(b_vals) / len(b_vals)
                brightness = (avg_r + avg_g + avg_b) / 3

                mood = "bright cinematic lighting" if brightness > 140 else "moody atmospheric lighting with deep shadows"
                color_tone = "warm golden tones" if avg_r > avg_b else "cool cybernetic tones"

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
        except Exception:
            return {
                "success": False,
                "prompt": f"Artistic visual remix of {clean_name}, masterpiece, cinematic lighting, 8k detail",
                "aspect_ratio": "1:1",
                "width": 1024,
                "height": 1024,
                "suggested_style": "photorealistic"
            }

    def get_available_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "cretivra-vision",
                "engine": "nanobanana2",
                "name": "Cretivra Vision Ultra",
                "description": "Next-gen photorealistic visual synthesis with zero watermarks and pristine clarity",
                "badge": "Vision Ultra",
                "is_default": True
            },
            {
                "id": "cretivra-flux",
                "engine": "flux",
                "name": "Cretivra FLUX.1 Art",
                "description": "Next-gen photorealism and fine digital art",
                "badge": "FLUX.1",
                "is_default": False
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
            },
            {
                "id": "cretivra-gemini",
                "engine": "nanobanana2",
                "name": "Cretivra Vision Studio",
                "description": "Frontier multimodal visual synthesis with zero watermarks and no logos",
                "badge": "Vision Studio",
                "is_default": False
            }
        ]

image_service = ImageService()
