import re
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.http_client import get_shared_client
from app.providers.base import AIProvider

class GroqProvider(AIProvider):
    """
    Internal Groq infrastructure provider for ultra-fast LPU inference.
    Capabilities:
    - Fast chat and low-latency answers (~300 tokens/sec)
    - General conversational and analytical responses
    - Code synthesis with Qwen
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", "") or ""

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unconfigured", "available": False}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                if res.status_code == 200:
                    return {"status": "connected", "available": True}
        except Exception as e:
            logger.debug(f"Groq health check exception: {e}")
        return {"status": "error", "available": False}

    async def list_models(self) -> List[str]:
        if not self.is_available():
            return []
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return [m.get("id") for m in data.get("data", []) if "id" in m]
        except Exception:
            pass
        return ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]

    def _resolve_model(self, model_id: str) -> str:
        m = (model_id or "").lower()
        if any(k in m for k in ["code", "qwen", "coder", "embed"]):
            return "qwen/qwen3.8-27b"
        elif any(k in m for k in ["fast", "quick", "mini", "speed"]):
            return "openai/gpt-oss-20b"
        return "openai/gpt-oss-120b"

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

        target_model = self._resolve_model(model)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Filter messages: Ensure role and content are clean
        cleaned_messages = []
        for m in messages:
            c = m.get("content", "")
            if not c:
                continue
            cleaned_messages.append({
                "role": m.get("role", "user"),
                "content": str(c)
            })

        if not cleaned_messages:
            cleaned_messages = [{"role": "user", "content": "Hello"}]

        temp = (options or {}).get("temperature", settings.TEMPERATURE)
        max_tokens = (options or {}).get("max_tokens", 4096)

        payload = {
            "model": target_model,
            "messages": cleaned_messages,
            "stream": True,
            "temperature": temp,
            "max_tokens": max_tokens
        }

        client = get_shared_client()
        try:
            async with client.stream("POST", url, headers=headers, json=payload, timeout=30.0) as response:
                if response.status_code != 200:
                    err_b = await response.aread()
                    err_msg = err_b.decode('utf-8', errors='ignore')
                    logger.warning(f"Groq stream error ({response.status_code}): {err_msg}")
                    if response.status_code in (401, 403):
                        raise ValueError(f"Invalid API key for Groq: {err_msg}")
                    elif response.status_code == 429:
                        raise RuntimeError(f"Rate limit exceeded for Groq (HTTP 429): {err_msg}")
                    return

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        yield {"content": "", "done": True}
                        return
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                        if reasoning:
                            yield {"content": "", "reasoning_status": "Asura is reasoning...", "done": False}
                        if content:
                            yield {"content": content, "done": False}
                    except Exception:
                        continue
                yield {"content": "", "done": True}
        except Exception as e:
            logger.warning(f"Groq streaming exception: {e}")

groq_provider = GroqProvider()
