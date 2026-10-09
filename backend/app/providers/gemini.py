import re
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.http_client import get_shared_client
from app.providers.base import AIProvider

class GeminiProvider(AIProvider):
    """
    Internal Google Gemini infrastructure provider for multimodal reasoning and vision.
    Capabilities:
    - Chat & streaming chat
    - Multimodal image/vision understanding
    - Creative tasks
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", "") or ""

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

    def _clean_key(self) -> str:
        return re.sub(r'[\r\n\t ]+', '', self.api_key)

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unconfigured", "available": False}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={self._clean_key()}")
                if res.status_code == 200:
                    return {"status": "connected", "available": True}
        except Exception as e:
            logger.debug(f"Gemini health check notice: {e}")
        return {"status": "error", "available": False}

    async def list_models(self) -> List[str]:
        if not self.is_available():
            return []
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={self._clean_key()}")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    return [m.get("name", "").replace("models/", "") for m in models if "name" in m]
        except Exception:
            pass
        return ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash-image"]

    def _resolve_model(self, model: str) -> List[str]:
        m = (model or "").lower()
        if "vision" in m or "image" in m:
            return ["gemini-2.5-flash-image", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"]
        elif "reason" in m or "pro" in m:
            return ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"]
        return ["gemini-3.1-flash-lite", "gemini-flash-lite-latest", "gemini-3-flash-preview"]

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        full_text = ""
        async for chunk in self.stream_chat(model, messages, options=options):
            full_text += chunk.get("content", "")
        return {
            "model": model,
            "message": {"role": "assistant", "content": full_text},
            "done": True
        }

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None,
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        if not self.is_available():
            return

        clean_key = self._clean_key()
        model_candidates = self._resolve_model(model)

        contents = []
        system_instructions = []

        for m in messages:
            role = m.get("role", "user")
            content_text = m.get("content", "")
            if not content_text:
                continue

            if role == "system":
                if isinstance(content_text, str):
                    system_instructions.append(content_text)
            else:
                gem_role = "user" if role == "user" else "model"
                txt = content_text if isinstance(content_text, str) else str(content_text)
                if contents and contents[-1]["role"] == gem_role:
                    contents[-1]["parts"][0]["text"] += f"\n\n{txt}"
                else:
                    contents.append({
                        "role": gem_role,
                        "parts": [{"text": txt}]
                    })

        if not contents:
            contents = [{"role": "user", "parts": [{"text": "Hello"}]}]

        # Inject multimodal images into latest user prompt
        if images:
            user_part = contents[-1]
            for c in reversed(contents):
                if c.get("role") == "user":
                    user_part = c
                    break
            for img in images:
                durl = img.get("data_url") or ""
                if "base64," in durl:
                    header, b64_data = durl.split("base64,", 1)
                    mime = header.replace("data:", "").replace(";", "").strip() or "image/png"
                    user_part["parts"].append({
                        "inline_data": {
                            "mime_type": mime,
                            "data": b64_data
                        }
                    })

        temp = (options or {}).get("temperature", settings.TEMPERATURE)
        max_tokens = (options or {}).get("max_tokens", 4096)
        is_search = bool((options or {}).get("is_search") or (options or {}).get("web_search"))

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temp,
                "maxOutputTokens": max_tokens
            }
        }
        if system_instructions:
            payload["system_instruction"] = {
                "parts": [{"text": "\n\n".join(system_instructions)}]
            }

        # Enable native Google Search grounding if requested
        if is_search:
            payload["tools"] = [{"googleSearch": {}}]

        client = get_shared_client()
        for gem_model in model_candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gem_model}:streamGenerateContent?alt=sse&key={clean_key}"
            try:
                async with client.stream("POST", url, json=payload, timeout=30.0) as response:
                    # Fallback without search tool if model doesn't support tools
                    if response.status_code == 400 and is_search:
                        logger.info(f"Gemini {gem_model} tool not supported, falling back to prompt-grounded retrieval")
                        fallback_payload = dict(payload)
                        fallback_payload.pop("tools", None)
                        async with client.stream("POST", url, json=fallback_payload, timeout=30.0) as fb_response:
                            if fb_response.status_code == 200:
                                response = fb_response
                    
                    if response.status_code == 200:
                        yielded_any = False
                        async for line in response.aiter_lines():
                            if not line or not line.startswith("data: "):
                                continue
                            data_str = line[6:].strip()
                            try:
                                data = json.loads(data_str)
                                candidates = data.get("candidates", [])
                                if candidates:
                                    first_cand = candidates[0]
                                    grounding_meta = first_cand.get("groundingMetadata")
                                    if grounding_meta:
                                        raw_queries = grounding_meta.get("webSearchQueries", [])
                                        raw_chunks = grounding_meta.get("groundingChunks", [])
                                        extracted_sources = []
                                        for chk in raw_chunks:
                                            web_info = chk.get("web", {})
                                            if web_info.get("uri"):
                                                extracted_sources.append({
                                                    "title": web_info.get("title", "Google Search Source"),
                                                    "url": web_info.get("uri"),
                                                    "domain": web_info.get("uri").split("/")[2] if "/" in web_info.get("uri") else "google.com"
                                                })
                                        if extracted_sources or raw_queries:
                                            yield {
                                                "content": "",
                                                "grounding_sources": extracted_sources,
                                                "search_queries": raw_queries,
                                                "done": False
                                            }

                                    parts = first_cand.get("content", {}).get("parts", [])
                                    for p in parts:
                                        text = p.get("text", "")
                                        if text:
                                            yielded_any = True
                                            yield {"content": text, "done": False}
                            except Exception:
                                continue
                        if yielded_any:
                            yield {"content": "", "done": True}
                            return
                    else:
                        err_b = await response.aread()
                        err_msg = err_b.decode('utf-8', errors='ignore')
                        logger.warning(f"Gemini {gem_model} error ({response.status_code}): {err_msg[:120]}")
                        if response.status_code in (401, 403) or "API_KEY_INVALID" in err_msg:
                            raise ValueError(f"Invalid API key for Gemini: {err_msg[:120]}")
                        elif response.status_code == 429:
                            raise RuntimeError(f"Rate limit exceeded for Gemini (HTTP 429): {err_msg[:120]}")
            except (ValueError, RuntimeError):
                raise
            except Exception as e:
                logger.warning(f"Gemini {gem_model} stream attempt failed: {e}")
                continue

gemini_provider = GeminiProvider()
