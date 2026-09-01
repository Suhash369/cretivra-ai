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

        yield {"content": "I am Cretivra AI. Please set your GROQ_API_KEY or GEMINI_API_KEY in Render Environment to enable high-speed cloud intelligence.", "done": True, "error": True}

    async def _stream_groq(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # Select best Groq model
        groq_model = "openai/gpt-oss-120b"
        if "qwen" in model.lower() or "cretivra-q" in model.lower():
            groq_model = "qwen/qwen3.8-27b"
        elif "compound" in model.lower() or "mini" in model.lower():
            groq_model = "groq/compound"

        payload = {
            "model": groq_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 4096
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    # Fallback to qwen/qwen3.8-27b if gpt-oss-120b failed
                    logger.warning(f"Groq {groq_model} returned {response.status_code}, falling back to qwen/qwen3.8-27b")
                    payload["model"] = "qwen/qwen3.8-27b"
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
                                    text = data["choices"][0]["delta"].get("content", "")
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
                            text = data["choices"][0]["delta"].get("content", "")
                            if text:
                                yield {"content": text, "done": False, "role": "assistant"}
                        except Exception:
                            pass
                yield {"content": "", "done": True, "role": "assistant"}

    async def _stream_gemini(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key={self.gemini_api_key}"
        contents = []
        for m in messages:
            role = "user" if m.get("role") in ["user", "system"] else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

        payload = {"contents": contents}

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    logger.error(f"Gemini API returned {response.status_code}: {err.decode('utf-8')}")
                    return

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

cloud_provider = CloudLLMProvider()
