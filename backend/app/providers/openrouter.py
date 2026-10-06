import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseLLMProvider

class OpenRouterProvider(BaseLLMProvider):
    """
    Internal OpenRouter infrastructure provider for frontier models & fallbacks.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "OPENROUTER_API_KEY", "") or ""

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unconfigured", "available": False}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    "https://openrouter.ai/api/v1/auth/key",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                if res.status_code == 200:
                    return {"status": "connected", "available": True}
        except Exception as e:
            logger.debug(f"OpenRouter health check notice: {e}")
        return {"status": "error", "available": False}

    async def list_models(self) -> List[str]:
        return ["nex-agi/nex-n2.5-mini:free", "nex-agi/nex-n2.5-pro:free", "meta-llama/llama-3.3-70b-instruct"]

    def _resolve_model(self, model: str) -> List[str]:
        m = (model or "").lower()
        if "reason" in m or "deepseek" in m:
            return ["deepseek/deepseek-r1", "nex-agi/nex-n2.5-pro:free", "meta-llama/llama-3.3-70b-instruct"]
        elif "code" in m or "coder" in m:
            return ["qwen/qwen-2.5-coder-32b-instruct", "nex-agi/nex-n2.5-mini:free"]
        return ["nex-agi/nex-n2.5-mini:free", "nex-agi/nex-n2.5-pro:free", "openai/gpt-4o-mini"]

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

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://asura.cretivra.com",
            "X-Title": "Cretivra Asura"
        }

        formatted_messages = [dict(m) for m in messages]
        if images:
            for idx in range(len(formatted_messages) - 1, -1, -1):
                if formatted_messages[idx].get("role") == "user":
                    user_content = formatted_messages[idx].get("content", "")
                    content_parts = []
                    if isinstance(user_content, str) and user_content.strip():
                        content_parts.append({"type": "text", "text": user_content})
                    for img in images:
                        durl = img.get("data_url")
                        if durl:
                            content_parts.append({"type": "image_url", "image_url": {"url": durl}})
                    formatted_messages[idx]["content"] = content_parts
                    break

        candidate_models = self._resolve_model(model)
        temp = (options or {}).get("temperature", settings.TEMPERATURE)
        max_tokens = (options or {}).get("max_tokens", 2048)

        async with httpx.AsyncClient(timeout=60.0) as client:
            for target_model in candidate_models:
                payload = {
                    "model": target_model,
                    "messages": formatted_messages,
                    "stream": True,
                    "temperature": temp,
                    "max_tokens": max_tokens
                }
                try:
                    async with client.stream("POST", "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload) as response:
                        if response.status_code == 200:
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
                                        yield {"content": "", "reasoning_status": "Thinking with deep reasoning...", "done": False}
                                    if content:
                                        yield {"content": content, "done": False}
                                except Exception:
                                    continue
                            yield {"content": "", "done": True}
                            return
                        else:
                            logger.warning(f"OpenRouter {target_model} stream error ({response.status_code})")
                except Exception as e:
                    logger.warning(f"OpenRouter {target_model} attempt failed: {e}")
                    continue

openrouter_provider = OpenRouterProvider()
