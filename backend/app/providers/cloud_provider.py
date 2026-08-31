import json
import asyncio
import httpx
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

def clean_markdown_symbols(text: str) -> str:
    """Strip markdown formatting symbols like #, **, *, and heading markers."""
    if not text:
        return text
    # Remove headers #, ##, ###
    t = re.sub(r'#+\s*', '', text)
    # Remove asterisks ** and *
    t = t.replace('**', '').replace('*', '')
    return t

class CloudLLMProvider:
    """
    Cloud AI Provider supporting Groq API & Google Gemini API
    with clean standard text formatting (no #, *, or ** symbols).
    """
    def __init__(self, api_key: Optional[str] = None):
        self.groq_api_key = getattr(settings, "GROQ_API_KEY", "") or ""
        self.gemini_api_key = api_key or getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "OPENROUTER_API_KEY", "") or ""

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # 1. Try free Groq API if configured
        if self.groq_api_key:
            async for chunk in self._stream_groq(model, messages):
                yield chunk
            return

        # 2. Try free Gemini API if configured
        if self.gemini_api_key:
            async for chunk in self._stream_gemini(model, messages):
                yield chunk
            return

        yield {"content": "No free Cloud API key configured in Settings.", "done": True, "error": True}

    async def _stream_groq(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # System instruction demanding plain text standard answers without # or *
        cleaned_messages = [
            {
                "role": "system",
                "content": "You are Cretivra AI. Provide clear, standard, well-structured paragraph answers. Do NOT use markdown special characters like headers (#, ##, ###), bold (**), or asterisks (*). Write clean natural prose."
            }
        ]
        
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role in ["user", "assistant", "system"] and content:
                cleaned_messages.append({"role": role, "content": content})

        groq_model = "groq/compound"

        payload = {
            "model": groq_model,
            "messages": cleaned_messages,
            "stream": True
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        logger.error(f"Groq API returned HTTP {response.status_code}: {error_body.decode('utf-8')}")
                        yield {"content": f"\n\n[Groq API error {response.status_code}]", "done": True, "error": True}
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]": break
                            try:
                                data = json.loads(data_str)
                                text = data["choices"][0]["delta"].get("content", "")
                                if text:
                                    clean_text = clean_markdown_symbols(text)
                                    yield {"content": clean_text, "done": False, "role": "assistant"}
                            except Exception:
                                pass
                    yield {"content": "", "done": True, "role": "assistant"}
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            yield {"content": f"\n\nGroq API error: {str(e)}", "done": True, "error": True}

    async def _stream_gemini(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key={self.gemini_api_key}"
        contents = [
            {"role": "user", "parts": [{"text": "System Instruction: Provide standard, clean, plain text paragraph answers. Do NOT use markdown special formatting characters like headers (#, ##, ###), bold (**), or asterisks (*)."}]}
        ]
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

        payload = {"contents": contents}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as response:
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
                                    clean_text = clean_markdown_symbols(text)
                                    yield {"content": clean_text, "done": False, "role": "assistant"}
                            except Exception:
                                pass
                    yield {"content": "", "done": True, "role": "assistant"}
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            yield {"content": f"\n\nGemini API error: {str(e)}", "done": True, "error": True}

cloud_provider = CloudLLMProvider()
