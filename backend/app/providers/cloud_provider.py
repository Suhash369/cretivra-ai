import json
import asyncio
import httpx
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

class CloudLLMProvider:
    """
    High-Performance Cloud AI Provider supporting Groq API & Google Gemini API.
    Streams real-time, world-class responses for any question asked.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.groq_api_key = getattr(settings, "GROQ_API_KEY", "") or ""
        self.gemini_api_key = api_key or getattr(settings, "GEMINI_API_KEY", "") or ""

    def has_keys(self) -> bool:
        return bool(self.groq_api_key or self.gemini_api_key)

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # 1. Try Groq API first (ultra-fast inference)
        if self.groq_api_key:
            try:
                has_yielded = False
                async for chunk in self._stream_groq(model, messages):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Groq stream error: {e}")

        # 2. Try Gemini API
        if self.gemini_api_key:
            try:
                has_yielded = False
                async for chunk in self._stream_gemini(model, messages):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Gemini stream error: {e}")

        yield {"content": "I am Cretivra AI. Please configure your GROQ_API_KEY or GEMINI_API_KEY in Environment Settings to enable high-speed cloud intelligence.", "done": True, "error": True}

    def _resolve_groq_model(self, model: str) -> str:
        m = (model or "").lower()
        if "fast" in m or "1.2" in m or "mini" in m:
            return "openai/gpt-oss-20b"
        elif "compound" in m:
            return "groq/compound"
        return "openai/gpt-oss-120b"

    async def _stream_groq(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        groq_model = self._resolve_groq_model(model)

        payload = {
            "model": groq_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.2,
            "max_tokens": 4096
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    # Fallback to alternate model if primary failed
                    fallback_model = "openai/gpt-oss-120b" if groq_model != "openai/gpt-oss-120b" else "qwen/qwen3.8-27b"
                    logger.warning(f"Groq {groq_model} returned {response.status_code}, falling back to {fallback_model}")
                    payload["model"] = fallback_model
                    async with client.stream("POST", url, headers=headers, json=payload) as fb_resp:
                        if fb_resp.status_code != 200:
                            err = await fb_resp.aread()
                            logger.error(f"Groq fallback failed: {err.decode('utf-8')}")
                            return
                        async for line in fb_resp.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]": break
                                try:
                                    data = json.loads(data_str)
                                    delta = data["choices"][0].get("delta", {})
                                    text = delta.get("content", "")
                                    if text:
                                        yield {"content": text, "done": False, "role": "assistant"}
                                except Exception:
                                    pass
                        yield {"content": "", "done": True, "role": "assistant"}
                        return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]": break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            text = delta.get("content", "")
                            if text:
                                yield {"content": text, "done": False, "role": "assistant"}
                        except Exception:
                            pass
                yield {"content": "", "done": True, "role": "assistant"}

    async def _stream_gemini(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        contents = []
        for m in messages:
            role = "user" if m.get("role") in ["user", "system"] else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

        payload = {"contents": contents}

        # Candidate Gemini models in priority order
        gemini_models = [
            "gemini-flash-latest",
            "gemini-3.6-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]

        async with httpx.AsyncClient(timeout=60.0) as client:
            for g_model in gemini_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:streamGenerateContent?alt=sse&key={self.gemini_api_key}"
                try:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if not data_str: continue
                                    try:
                                        data = json.loads(data_str)
                                        candidates = data.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            text = parts[0].get("text", "") if parts else ""
                                            if text:
                                                yield {"content": text, "done": False, "role": "assistant"}
                                    except Exception:
                                        pass
                            yield {"content": "", "done": True, "role": "assistant"}
                            return
                        else:
                            logger.warning(f"Gemini model {g_model} returned {response.status_code}, trying next model...")
                except Exception as e:
                    logger.warning(f"Gemini {g_model} connection error: {e}")
                    continue

cloud_provider = CloudLLMProvider()
