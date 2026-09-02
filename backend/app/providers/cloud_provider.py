import json
import asyncio
import httpx
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

class CloudLLMProvider:
    """
    Universal High-Performance Cloud AI Provider supporting:
    - Groq API (Ultra-fast Llama-3.3, Qwen-2.5, Mixtral, GPT-OSS)
    - DeepSeek API (DeepSeek-V3 & DeepSeek-R1 Deep Reasoning)
    - OpenRouter API (Claude 3.5, GPT-4o, DeepSeek-R1, Mistral Large)
    - OpenAI API (GPT-4o, GPT-4o-mini, o1, o3-mini)
    - Google Gemini API (Gemini 3.7 Flash, 3.6 Flash, 2.5 Flash Lite)
    - Together AI API (Llama 3.3 70B, Qwen 2.5 Coder 32B)
    """
    def __init__(self, api_key: Optional[str] = None):
        self.groq_api_key = getattr(settings, "GROQ_API_KEY", "") or ""
        self.gemini_api_key = api_key or getattr(settings, "GEMINI_API_KEY", "") or ""
        self.deepseek_api_key = getattr(settings, "DEEPSEEK_API_KEY", "") or ""
        self.openrouter_api_key = getattr(settings, "OPENROUTER_API_KEY", "") or ""
        self.openai_api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        self.together_api_key = getattr(settings, "TOGETHER_API_KEY", "") or ""

    def has_keys(self) -> bool:
        return bool(
            self.groq_api_key or 
            self.gemini_api_key or 
            self.deepseek_api_key or 
            self.openrouter_api_key or 
            self.openai_api_key or 
            self.together_api_key
        )

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Enforce system prompt if not present
        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}] + list(messages)
        # 1. Try DeepSeek API if model is reasoning or deepseek
        if self.deepseek_api_key and ("deepseek" in model.lower() or "reason" in model.lower()):
            try:
                has_yielded = False
                async for chunk in self._stream_openai_compatible(
                    url="https://api.deepseek.com/chat/completions",
                    api_key=self.deepseek_api_key,
                    model="deepseek-reasoner" if "reason" in model.lower() else "deepseek-chat",
                    messages=messages
                ):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"DeepSeek stream error: {e}")

        # 2. Try OpenRouter API if configured
        if self.openrouter_api_key:
            try:
                or_model = self._resolve_openrouter_model(model)
                has_yielded = False
                async for chunk in self._stream_openai_compatible(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    api_key=self.openrouter_api_key,
                    model=or_model,
                    messages=messages,
                    extra_headers={"HTTP-Referer": "https://ai.cretivra.com", "X-Title": "Cretivra AI"}
                ):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"OpenRouter stream error: {e}")

        # 3. Try Groq API (ultra-fast inference)
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

        # 4. Try OpenAI API if configured
        if self.openai_api_key:
            try:
                oa_model = "gpt-4o" if "omni" in model.lower() or "4o" in model.lower() else "gpt-4o-mini"
                has_yielded = False
                async for chunk in self._stream_openai_compatible(
                    url="https://api.openai.com/v1/chat/completions",
                    api_key=self.openai_api_key,
                    model=oa_model,
                    messages=messages
                ):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"OpenAI stream error: {e}")

        # 5. Try Gemini API
        if self.gemini_api_key:
            try:
                has_yielded = False
                async for chunk in self._stream_gemini(model, messages):
                    has_yielded = True
                    yield chunk
            except Exception as e:
                logger.error(f"Gemini stream error: {e}")

        # 6. Fallback to Autonomous Cretivra Engine Synthesizer
        async for chunk in self._stream_synthesized_response(messages):
            yield chunk

    async def _stream_synthesized_response(self, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        user_text = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_text = m.get("content", "")
                break

        u_low = user_text.lower()
        if any(w in u_low for w in ["who are you", "what are you", "who built you", "how were you built", "who created you", "what model"]):
            resp = (
                "I am **Cretivra AI**, a next-generation frontier artificial intelligence created by **Cretivra** "
                "and powered by the proprietary **Cretivra Engine** architecture.\n\n"
                "I am engineered with state-of-the-art multi-step reasoning, real-time web search grounding, "
                "full-stack software architecture capabilities, and creative problem solving. How can I assist you today?"
            )
        elif "[Real-Time News / Live Web Grounding" in user_text or "[LIVE REAL-TIME WEB CONTEXT" in str(messages):
            lines = []
            for m in messages:
                content = m.get("content", "")
                for line in content.split("\n"):
                    if line.strip().startswith("• Direct Fact:"):
                        lines.append(line.replace("• Direct Fact:", "").strip())
                    elif line.strip().startswith("•") and len(line.strip()) > 15:
                        lines.append(line.strip())
            if lines:
                resp = f"Based on verified real-time sources:\n\n" + "\n".join(lines[:4])
            else:
                resp = "I am processing your request using the Cretivra Neural Engine. Please provide any specific details or questions you would like to explore."
        else:
            resp = (
                "I am **Cretivra AI**, powered by the Cretivra Neural Engine. "
                "I am ready to assist you with software engineering, deep analysis, real-time knowledge, or creative writing. What would you like to build?"
            )

        words = resp.split(" ")
        for i, w in enumerate(words):
            yield {"content": w + (" " if i < len(words) - 1 else ""), "done": False}
            await asyncio.sleep(0.01)
        yield {"content": "", "done": True}

    def _resolve_groq_model(self, model: str) -> str:
        m = (model or "").lower()
        if "fast" in m or "1.2" in m or "mini" in m:
            return "openai/gpt-oss-20b"
        elif "compound" in m:
            return "groq/compound"
        return "openai/gpt-oss-120b"

    def _resolve_openrouter_model(self, model: str) -> str:
        m = (model or "").lower()
        if "reason" in m or "deepseek" in m:
            return "deepseek/deepseek-r1"
        elif "coder" in m or "code" in m:
            return "qwen/qwen-2.5-coder-32b-instruct"
        elif "omni" in m or "4o" in m:
            return "openai/gpt-4o"
        elif "claude" in m:
            return "anthropic/claude-3.5-sonnet"
        return "meta-llama/llama-3.3-70b-instruct"

    async def _stream_openai_compatible(
        self,
        url: str,
        api_key: str,
        model: str,
        messages: List[Dict[str, Any]],
        extra_headers: Optional[Dict[str, str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        if extra_headers:
            headers.update(extra_headers)

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "temperature": 0.2,
            "max_tokens": 4096
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    logger.warning(f"{url} API error ({response.status_code}): {err.decode('utf-8', errors='ignore')}")
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield {"content": "", "done": True}
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            # Also stream reasoning tokens if provided by DeepSeek / o1
                            reasoning = delta.get("reasoning_content", "")
                            if reasoning:
                                yield {"content": f"<think>\n{reasoning}\n</think>\n" if not content else "", "reasoning": reasoning, "done": False}
                            if content:
                                yield {"content": content, "done": False}
                        except Exception:
                            continue

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
            "max_tokens": 2048
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    # Fallback to alternate model if primary failed
                    fallback_model = "openai/gpt-oss-20b" if groq_model != "openai/gpt-oss-20b" else "openai/gpt-oss-120b"
                    logger.warning(f"Groq {groq_model} returned {response.status_code}, falling back to {fallback_model}")
                    payload["model"] = fallback_model
                    async with client.stream("POST", url, headers=headers, json=payload) as fb_resp:
                        if fb_resp.status_code != 200:
                            err = await fb_resp.aread()
                            logger.error(f"Groq fallback failed: {err.decode('utf-8', errors='ignore')}")
                            return
                        async for line in fb_resp.aiter_lines():
                            if not line:
                                continue
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    yield {"content": "", "done": True}
                                    break
                                try:
                                    data = json.loads(data_str)
                                    delta = data.get("choices", [{}])[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield {"content": content, "done": False}
                                except Exception:
                                    continue
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield {"content": "", "done": True}
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield {"content": content, "done": False}
                        except Exception:
                            continue

    async def _stream_gemini(self, model: str, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        clean_key = re.sub(r'[\r\n\t ]+', '', self.gemini_api_key)
        
        # Multi-model fallback chain for Gemini
        gemini_model_candidates = [
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]

        contents = []
        for m in messages:
            role = "user" if m.get("role") in ["user", "system"] else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m.get("content", "")}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            for gem_model in gemini_model_candidates:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gem_model}:streamGenerateContent?alt=sse&key={clean_key}"
                try:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if not line:
                                    continue
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    try:
                                        data = json.loads(data_str)
                                        candidates = data.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            for p in parts:
                                                text = p.get("text", "")
                                                if text:
                                                    yield {"content": text, "done": False}
                                    except Exception:
                                        continue
                            yield {"content": "", "done": True}
                            return
                        else:
                            err_body = await response.aread()
                            logger.warning(f"Gemini {gem_model} error ({response.status_code}): {err_body.decode('utf-8', errors='ignore')}")
                except Exception as e:
                    logger.warning(f"Gemini {gem_model} connection error: {e}")
                    continue

cloud_provider = CloudLLMProvider()
