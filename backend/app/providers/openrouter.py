import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import AIProvider

class OpenRouterProvider(AIProvider):
    """
    Internal OpenRouter infrastructure provider for multi-model access.
    Treated as a first-class provider offering multiple configurable models
    for reasoning, coding, and general tasks.
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
        if not self.is_available():
            return []
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get("https://openrouter.ai/api/v1/models")
                if res.status_code == 200:
                    data = res.json()
                    return [m.get("id") for m in data.get("data", []) if "id" in m]
        except Exception:
            pass
        return [
            "liquid/lfm-2.5-2.6b:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "nvidia/nemotron-3.5-lightning:free",
            "google/gemma-4-26b-a4b-it:free"
        ]

    def _resolve_model(self, model: str) -> List[str]:
        m = (model or "").lower()
        if "reason" in m or "logic" in m or "math" in m:
            return [
                "liquid/lfm-2.5-2.6b:free",
                "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                "nvidia/nemotron-3.5-lightning:free"
            ]
        elif "code" in m or "coder" in m:
            return [
                "liquid/lfm-2.5-2.6b:free",
                "nvidia/nemotron-3.5-lightning:free",
                "google/gemma-4-26b-a4b-it:free"
            ]
        return [
            "liquid/lfm-2.5-2.6b:free",
            "nvidia/nemotron-3.5-lightning:free",
            "google/gemma-4-26b-a4b-it:free"
        ]

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

        formatted_messages = []
        for m in messages:
            content_val = m.get("content", "")
            if not content_val:
                continue
            formatted_messages.append({
                "role": m.get("role", "user"),
                "content": str(content_val)
            })

        if not formatted_messages:
            formatted_messages = [{"role": "user", "content": "Hello"}]

        if images:
            for idx in range(len(formatted_messages) - 1, -1, -1):
                if formatted_messages[idx].get("role") == "user":
                    user_content = formatted_messages[idx].get("content", "")
                    content_parts = []
                    if user_content.strip():
                        content_parts.append({"type": "text", "text": user_content})
                    for img in images:
                        durl = img.get("data_url")
                        if durl:
                            content_parts.append({"type": "image_url", "image_url": {"url": durl}})
                    formatted_messages[idx]["content"] = content_parts
                    break

        candidate_models = self._resolve_model(model)
        temp = (options or {}).get("temperature", settings.TEMPERATURE)
        max_tokens = (options or {}).get("max_tokens", 4096)

        is_search = bool((options or {}).get("is_search") or (options or {}).get("web_search"))

        async with httpx.AsyncClient(timeout=45.0) as client:
            for target_model in candidate_models:
                payload: Dict[str, Any] = {
                    "model": target_model,
                    "messages": formatted_messages,
                    "stream": True,
                    "temperature": temp,
                    "max_tokens": max_tokens
                }
                if is_search:
                    # Enable OpenRouter web search plugin and tool
                    payload["plugins"] = [{"id": "web"}]
                    payload["tools"] = [{"type": "openrouter:web_search"}]

                try:
                    async with client.stream("POST", "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload) as response:
                        # Fallback if model doesn't support the web plugin
                        if response.status_code == 400 and is_search:
                            logger.info(f"OpenRouter {target_model} tool error, falling back to pre-grounded prompt")
                            fallback_payload = dict(payload)
                            fallback_payload.pop("plugins", None)
                            fallback_payload.pop("tools", None)
                            async with client.stream("POST", "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=fallback_payload) as fb_response:
                                if fb_response.status_code == 200:
                                    response = fb_response
                        if response.status_code == 200:
                            yielded_any = False
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
                                        yielded_any = True
                                        yield {"content": content, "done": False}
                                except Exception:
                                    continue
                            if yielded_any:
                                yield {"content": "", "done": True}
                                return
                        else:
                            logger.warning(f"OpenRouter {target_model} stream error ({response.status_code})")
                except Exception as e:
                    logger.warning(f"OpenRouter {target_model} attempt failed: {e}")
                    continue

openrouter_provider = OpenRouterProvider()
