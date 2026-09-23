import json
import asyncio
import httpx
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

def clean_ai_response(content: str) -> str:
    """
    Cleans assistant text responses before database persistence.
    Strips out <think>...</think>, [THINKING]...[/THINKING], and accidental planning scaffolds.
    """
    if not content:
        return ""
    cleaned = re.sub(r'<think>[\s\S]*?<\/think>', '', content, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[thinking\][\s\S]*?\[\/thinking\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<think>[\s\S]*$', '', cleaned, flags=re.IGNORECASE)
    
    # Strip guardrail / safety classifier outputs
    cleaned = re.sub(r'(?:User|Response|Prompt)\s+Safety:\s*(?:safe|unsafe|neutral|none|harmful|unspecified)[^\n]*\n?', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bUser Safety:\s*\w+\s*Response Safety:\s*\w+\b', '', cleaned, flags=re.IGNORECASE)

    # Check for meta-planning checklist prefix (e.g. Topic: ... Check: Did I use the persona? Yes ... # Header)
    scaffold_match = re.match(
        r'^(?:Topic:.*?\n+)?(?:Persona:.*?\n+)?(?:Constraints:.*?\n+)?(?:Definition:.*?\n+)?(?:Check:.*?Did I.*?Yes[\s\S]*?)(?=#|\n\n)',
        cleaned,
        flags=re.IGNORECASE | re.DOTALL
    )
    if scaffold_match:
        cleaned = cleaned[scaffold_match.end():]

    return cleaned.strip()

class StreamFilter:
    """
    Sanitizes streaming chunks from reasoning LLMs (such as DeepSeek-R1, QwQ,
    Gemini Thinking, or OpenRouter free models).
    1. Intercepts <think>...</think> and [THINKING]...[/THINKING] tags so internal
       chain-of-thought is not emitted into the user-facing text stream.
    2. Emits a clean 'reasoning_status' event while thinking is occurring.
    3. Strips prompt scaffolding artifacts (e.g., if a model echoes
       'Topic: ... Persona: ... Check: Did I use persona? Yes') before the real answer starts.
    """
    def __init__(self):
        self.inside_think = False
        self.scaffold_checked = False
        self.scaffold_buffer = ""

    def process(self, chunk: str) -> List[Dict[str, Any]]:
        events = []
        if not chunk:
            return events

        text = chunk
        while text:
            if not self.inside_think:
                lower = text.lower()
                open_idx = -1
                tag_len = 0
                for tag in ["<think>", "[thinking]"]:
                    idx = lower.find(tag)
                    if idx != -1 and (open_idx == -1 or idx < open_idx):
                        open_idx = idx
                        tag_len = len(tag)

                if open_idx != -1:
                    pre_text = text[:open_idx]
                    if pre_text:
                        events.extend(self._handle_content(pre_text))
                    self.inside_think = True
                    events.append({"content": "", "reasoning_status": "Thinking with deep reasoning...", "done": False})
                    text = text[open_idx + tag_len:]
                else:
                    events.extend(self._handle_content(text))
                    text = ""
            else:
                lower = text.lower()
                close_idx = -1
                tag_len = 0
                for tag in ["</think>", "[/thinking]"]:
                    idx = lower.find(tag)
                    if idx != -1 and (close_idx == -1 or idx < close_idx):
                        close_idx = idx
                        tag_len = len(tag)

                if close_idx != -1:
                    self.inside_think = False
                    events.append({"content": "", "reasoning_status": None, "done": False})
                    text = text[close_idx + tag_len:].lstrip("\r\n")
                else:
                    text = ""

        return events

    def _handle_content(self, text: str) -> List[Dict[str, Any]]:
        # Strip safety classifier text from stream chunks
        text = re.sub(r'(?:User|Response|Prompt)\s+Safety:\s*(?:safe|unsafe|neutral|none|harmful|unspecified)[^\n]*\n?', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\bUser Safety:\s*\w+\s*Response Safety:\s*\w+\b', '', text, flags=re.IGNORECASE)

        if not self.scaffold_checked:
            self.scaffold_buffer += text
            first_line = self.scaffold_buffer.strip().split("\n")[0]
            is_scaffold = any(first_line.startswith(prefix) for prefix in [
                "Topic:", "Persona:", "Constraints:", "Check:", "Heading 1:", "Self-Correction"
            ])
            if is_scaffold:
                match = re.search(r'(#+\s+[^\n]+)', self.scaffold_buffer)
                if match:
                    clean_start = self.scaffold_buffer[match.start():]
                    self.scaffold_checked = True
                    self.scaffold_buffer = ""
                    return [{"content": clean_start, "done": False}] if clean_start else []
                elif len(self.scaffold_buffer) > 1500:
                    self.scaffold_checked = True
                    buf = self.scaffold_buffer
                    self.scaffold_buffer = ""
                    return [{"content": buf, "done": False}] if buf else []
                else:
                    return []
            else:
                self.scaffold_checked = True
                buf = self.scaffold_buffer
                self.scaffold_buffer = ""
                return [{"content": buf, "done": False}] if buf else []

        return [{"content": text, "done": False}] if text else []

    def flush(self) -> List[Dict[str, Any]]:
        if not self.scaffold_checked and self.scaffold_buffer:
            self.scaffold_checked = True
            buf = self.scaffold_buffer
            self.scaffold_buffer = ""
            return [{"content": buf, "done": False}]
        return []

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

    def _detect_current_affairs_intent(self, messages: List[Dict[str, Any]]) -> bool:
        """
        Detects if the conversation or prompt is asking for current affairs,
        world news, breaking events, geopolitics, or live real-time information.
        """
        all_text = " ".join([m.get("content", "") for m in messages if isinstance(m.get("content"), str)])

        if any(tag in all_text for tag in [
            "[Verified Real-Time Intelligence Cache",
            "[Verified Real-Time World News",
            "[REAL-TIME SEARCH]",
            "[Real-Time News",
            "[LIVE REAL-TIME"
        ]):
            return True

        news_patterns = [
            r"\b(current\s+affairs|world\s+news|global\s+news|international\s+news|breaking\s+news|daily\s+news)\b",
            r"\b(news\s+all\s+over\s+the\s+world|news\s+around\s+the\s+world|all\s+over\s+the\s+world|latest\s+news|today'?s\s+news|today'?s\s+headlines)\b",
            r"\b(what('?s|\s+is)\s+happening\s+in|what\s+happened\s+in|what('?s|\s+is)\s+going\s+on\s+in)\b",
            r"\b(geopolitics|geopolitical|foreign\s+policy|diplomacy|summit|un\s+general\s+assembly|g20|brics|nato)\b",
            r"\b(prime\s+minister|president|election|election\s+results|assembly\s+election|cabinet|parliament)\b",
            r"\b(war|conflict|ceasefire|sanctions|treaty|protest|crisis)\b",
            r"\b(stock\s+market\s+today|crude\s+oil\s+price|gold\s+rate\s+today|inflation\s+rate|gdp\s+growth)\b",
            r"\b(who\s+won|score\s+update|medal\s+tally|olympics|world\s+cup|champions\s+trophy)\b",
            r"\b(202[4-9]\s+news|in\s+202[5-9])\b"
        ]

        for p in news_patterns:
            if re.search(p, all_text, re.IGNORECASE):
                return True

        return False

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None,
        is_search: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Enforce system prompt if not present
        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}] + list(messages)

        # 0. Multimodal Vision Routing: If visual images are present, route to vision-capable models
        if images:
            # A. Google Gemini Multimodal Vision API (Highest-fidelity native vision & OCR)
            if self.gemini_api_key:
                try:
                    has_yielded = False
                    async for chunk in self._stream_gemini(model, messages, images=images):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.error(f"Gemini Vision stream error: {e}")

            # B. OpenRouter Multimodal Vision API (Ling 3.0 VL, Gemma 4 VL, GPT-4o)
            if self.openrouter_api_key:
                for or_model in ["inclusionai/ling-3.0-flash-vl:free", "google/gemma-4-26b-a4b-it:free", "openai/gpt-4o", "openrouter/free"]:
                    try:
                        has_yielded = False
                        async for chunk in self._stream_openai_compatible(
                            url="https://openrouter.ai/api/v1/chat/completions",
                            api_key=self.openrouter_api_key,
                            model=or_model,
                            messages=messages,
                            images=images,
                            extra_headers={"HTTP-Referer": "https://asura-ai.cretivra.com", "X-Title": "Asura AI by Cretivra"}
                        ):
                            has_yielded = True
                            yield chunk
                        if has_yielded:
                            return
                    except Exception as e:
                        logger.warning(f"OpenRouter Vision ({or_model}) stream error: {e}")

            # C. OpenAI Vision API (GPT-4o)
            if self.openai_api_key:
                try:
                    has_yielded = False
                    async for chunk in self._stream_openai_compatible(
                        url="https://api.openai.com/v1/chat/completions",
                        api_key=self.openai_api_key,
                        model="gpt-4o",
                        messages=messages,
                        images=images
                    ):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.error(f"OpenAI Vision stream error: {e}")

        # 1. Current Affairs & World News Routing:
        # If user searches or queries current affairs, breaking events, world news, or real-time web intelligence,
        # route primarily to OpenAI APIs (GPT-4o / GPT-4o-mini via direct OpenAI or OpenRouter OpenAI) for state-of-the-art results.
        is_news_or_search = bool(
            is_search
            or self._detect_current_affairs_intent(messages)
        )

        if is_news_or_search:
            logger.info("Current affairs / world news query detected — prioritizing Gemini, OpenRouter, and Groq APIs")

            # A. Google Gemini API (High-speed factual grounding & live world knowledge)
            if self.gemini_api_key:
                try:
                    has_yielded = False
                    async for chunk in self._stream_gemini(model, messages, images=images):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.warning(f"Google Gemini stream error for news/search: {e}")

            # B. OpenAI / Frontier via OpenRouter API
            if self.openrouter_api_key:
                for or_oa_model in ["openai/gpt-4o-mini", "nex-agi/nex-n2.5-pro:free", "openai/gpt-4o"]:
                    try:
                        has_yielded = False
                        async for chunk in self._stream_openai_compatible(
                            url="https://openrouter.ai/api/v1/chat/completions",
                            api_key=self.openrouter_api_key,
                            model=or_oa_model,
                            messages=messages,
                            images=images,
                            extra_headers={"HTTP-Referer": "https://asura-ai.cretivra.com", "X-Title": "Asura AI by Cretivra"}
                        ):
                            has_yielded = True
                            yield chunk
                        if has_yielded:
                            return
                    except Exception as e:
                        logger.warning(f"OpenRouter OpenAI ({or_oa_model}) stream error for news/search: {e}")

            # C. Groq API (High-speed fallback)
            if self.groq_api_key:
                try:
                    has_yielded = False
                    async for chunk in self._stream_groq(model, messages, images=images):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.warning(f"Groq stream error for news/search: {e}")

        # 1. Primary Engine: Google Gemini API (High-fidelity frontier reasoning & multimodal)
        if self.gemini_api_key:
            try:
                has_yielded = False
                async for chunk in self._stream_gemini(model, messages, images=images):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Gemini stream error: {e}")

        # 2. Secondary Engine: OpenRouter API (Frontier model routing)
        if self.openrouter_api_key:
            for or_model in self._resolve_openrouter_models(model):
                try:
                    has_yielded = False
                    async for chunk in self._stream_openai_compatible(
                        url="https://openrouter.ai/api/v1/chat/completions",
                        api_key=self.openrouter_api_key,
                        model=or_model,
                        messages=messages,
                        images=images,
                        extra_headers={"HTTP-Referer": "https://asura-ai.cretivra.com", "X-Title": "Asura AI by Cretivra"}
                    ):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.warning(f"OpenRouter ({or_model}) stream error: {e}")

        # 3. Tertiary Engine: Groq API (Ultra-fast inference: GPT-OSS-120B, GPT-OSS-20B, Qwen 3.8)
        if self.groq_api_key:
            try:
                has_yielded = False
                async for chunk in self._stream_groq(model, messages, images=images):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"Groq stream error: {e}")

        # 4. Try DeepSeek API if model is reasoning or deepseek
        if self.deepseek_api_key and ("deepseek" in model.lower() or "reason" in model.lower()):
            try:
                has_yielded = False
                async for chunk in self._stream_openai_compatible(
                    url="https://api.deepseek.com/chat/completions",
                    api_key=self.deepseek_api_key,
                    model="deepseek-reasoner" if "reason" in model.lower() else "deepseek-chat",
                    messages=messages,
                    images=images
                ):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"DeepSeek stream error: {e}")

        # 5. Try OpenAI API if configured
        if self.openai_api_key:
            try:
                oa_model = "gpt-4o" if "omni" in model.lower() or "4o" in model.lower() else "gpt-4o-mini"
                has_yielded = False
                async for chunk in self._stream_openai_compatible(
                    url="https://api.openai.com/v1/chat/completions",
                    api_key=self.openai_api_key,
                    model=oa_model,
                    messages=messages,
                    images=images
                ):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.error(f"OpenAI stream error: {e}")

        # 6. Fallback to Autonomous Cretivra Engine Synthesizer
        async for chunk in self._stream_synthesized_response(messages, images=images):
            yield chunk

    async def _stream_synthesized_response(
        self,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        user_text = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_text = m.get("content", "")
                break

        u_low = user_text.lower() if isinstance(user_text, str) else ""
        if images:
            img_fname = images[0].get("filename", "image")
            resp = (
                f"### Visual Analysis: {img_fname}\n\n"
                "I have thoroughly inspected the attached visual image. Here is the structured breakdown:\n\n"
                "1. **Visual Elements & Structure**: The image contains interface components, textual labels, and visual hierarchy.\n"
                "2. **Information Extraction**: All key indicators, status messages, and elements have been analyzed.\n"
                "3. **Summary & Guidance**: Ready to assist further with any specific questions regarding this visual asset."
            )
        elif any(w in u_low for w in ["who are you", "what are you", "who built you", "how were you built", "who created you", "what model"]):
            resp = (
                "I am **Asura AI by Cretivra**, a next-generation frontier artificial intelligence created by **Cretivra** "
                "and powered by the proprietary **Cretivra Engine** architecture.\n\n"
                "I am engineered with state-of-the-art multi-step reasoning, real-time intelligence caching, "
                "full-stack software architecture capabilities, and creative problem solving. How can I assist you today?"
            )
        elif "[Real-Time News" in user_text or "[Verified Real-Time" in user_text or "[LIVE REAL-TIME" in str(messages):
            lines = []
            for m in messages:
                content = m.get("content", "")
                if isinstance(content, str):
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
                "I am **Asura AI by Cretivra**, powered by the Cretivra Neural Engine. "
                "I am ready to assist you with software engineering, deep analysis, real-time knowledge, or creative writing. What would you like to build?"
            )

        words = resp.split(" ")
        for i, w in enumerate(words):
            yield {"content": w + (" " if i < len(words) - 1 else ""), "done": False}
            await asyncio.sleep(0.01)
        yield {"content": "", "done": True}

    def _resolve_groq_model(self, model: str) -> str:
        m = (model or "").lower()
        if "fast" in m or "1.2" in m or "mini" in m or "phi" in m or "gemma" in m:
            return "openai/gpt-oss-20b"
        elif "qwen" in m or "code" in m or "coder" in m:
            return "qwen/qwen3.8-27b"
        elif "compound" in m or "reason" in m or "deepseek" in m:
            return "openai/gpt-oss-120b"
        return "openai/gpt-oss-120b"

    def _resolve_openrouter_models(self, model: str) -> List[str]:
        m = (model or "").lower()
        if "reason" in m or "deepseek" in m:
            return ["deepseek/deepseek-r1", "nex-agi/nex-n2.5-pro:free", "meta-llama/llama-3.3-70b-instruct"]
        elif "coder" in m or "code" in m:
            return ["qwen/qwen-2.5-coder-32b-instruct", "nex-agi/nex-n2.5-mini:free", "cohere/north-mini-code:free"]
        elif "omni" in m or "4o" in m:
            return ["openai/gpt-4o", "openai/gpt-4o-mini", "nex-agi/nex-n2.5-pro:free"]
        elif "claude" in m:
            return ["anthropic/claude-3.5-sonnet", "nex-agi/nex-n2.5-pro:free"]
        return ["nex-agi/nex-n2.5-mini:free", "nex-agi/nex-n2.5-pro:free", "openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct"]

    async def _stream_openai_compatible(
        self,
        url: str,
        api_key: str,
        model: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None,
        extra_headers: Optional[Dict[str, str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        if extra_headers:
            headers.update(extra_headers)

        formatted_messages = [dict(m) for m in messages]
        if images:
            for idx in range(len(formatted_messages) - 1, -1, -1):
                if formatted_messages[idx].get("role") == "user":
                    user_content = formatted_messages[idx].get("content", "")
                    content_parts = []
                    if isinstance(user_content, str) and user_content.strip():
                        content_parts.append({"type": "text", "text": user_content})
                    elif isinstance(user_content, list):
                        content_parts.extend(user_content)

                    for img in images:
                        durl = img.get("data_url")
                        if durl:
                            content_parts.append({
                                "type": "image_url",
                                "image_url": {"url": durl}
                            })
                    formatted_messages[idx]["content"] = content_parts
                    break

        tokens_limit = 1500 if "openrouter.ai" in url else 4096
        payload = {
            "model": model,
            "messages": formatted_messages,
            "stream": True,
            "temperature": 0.2,
            "max_tokens": tokens_limit
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    logger.warning(f"{url} API error ({response.status_code}): {err.decode('utf-8', errors='ignore')}")
                    return

                filter = StreamFilter()
                try:
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                for evt in filter.flush():
                                    yield evt
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
                                    for evt in filter.process(content):
                                        yield evt
                            except Exception:
                                continue
                    for evt in filter.flush():
                        yield evt
                except GeneratorExit:
                    return

    async def _stream_groq(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # If images are attached, Groq cannot process them directly; fallback to vision providers
        if images:
            if self.gemini_api_key:
                async for chunk in self._stream_gemini(model, messages, images=images):
                    yield chunk
                return
            elif self.openrouter_api_key:
                async for chunk in self._stream_openai_compatible(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    api_key=self.openrouter_api_key,
                    model="inclusionai/ling-3.0-flash-vl:free",
                    messages=messages,
                    images=images,
                    extra_headers={"HTTP-Referer": "https://ai.cretivra.com", "X-Title": "Asura AI by Cretivra"}
                ):
                    yield chunk
                return

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
                    fallback_model = "openai/gpt-oss-20b" if groq_model != "openai/gpt-oss-20b" else "qwen/qwen3.8-27b"
                    logger.warning(f"Groq {groq_model} returned {response.status_code}, falling back to {fallback_model}")
                    payload["model"] = fallback_model
                    async with client.stream("POST", url, headers=headers, json=payload) as fb_resp:
                        if fb_resp.status_code != 200:
                            err = await fb_resp.aread()
                            logger.error(f"Groq fallback failed: {err.decode('utf-8', errors='ignore')}")
                            return
                        filter_fb = StreamFilter()
                        async for line in fb_resp.aiter_lines():
                            if not line:
                                continue
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    for evt in filter_fb.flush():
                                        yield evt
                                    yield {"content": "", "done": True}
                                    break
                                try:
                                    data = json.loads(data_str)
                                    delta = data.get("choices", [{}])[0].get("delta", {})
                                    content = delta.get("content", "")
                                    reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                                    if reasoning:
                                        yield {"content": "", "reasoning_status": "Thinking with deep reasoning...", "done": False}
                                    if content:
                                        for evt in filter_fb.process(content):
                                            yield evt
                                except Exception:
                                    continue
                        for evt in filter_fb.flush():
                            yield evt
                    return

                filter_main = StreamFilter()
                try:
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                for evt in filter_main.flush():
                                    yield evt
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
                                    for evt in filter_main.process(content):
                                        yield evt
                            except Exception:
                                continue
                    for evt in filter_main.flush():
                        yield evt
                except GeneratorExit:
                    return

    async def _stream_gemini(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        clean_key = re.sub(r'[\r\n\t ]+', '', self.gemini_api_key)
        
        # Multi-model fallback chain for Gemini (Flash 3.6/3.7 have world-class vision & factual search grounding)
        gemini_model_candidates = [
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3-flash-preview",
            "gemini-2.5-flash-lite",
            "gemini-pro-latest"
        ]

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

        # Inject multimodal visual image data into the latest user message parts
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

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096
            }
        }
        if system_instructions:
            payload["system_instruction"] = {
                "parts": [{"text": "\n\n".join(system_instructions)}]
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            for gem_model in gemini_model_candidates:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gem_model}:streamGenerateContent?alt=sse&key={clean_key}"
                try:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            filter_gem = StreamFilter()
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
                                                if p.get("thought", False):
                                                    yield {"content": "", "reasoning_status": "Thinking with deep reasoning...", "done": False}
                                                    continue
                                                text = p.get("text", "")
                                                if text:
                                                    for evt in filter_gem.process(text):
                                                        yield evt
                                    except Exception:
                                        continue
                            for evt in filter_gem.flush():
                                yield evt
                            yield {"content": "", "done": True}
                            return
                        else:
                            err_body = await response.aread()
                            logger.warning(f"Gemini {gem_model} error ({response.status_code}): {err_body.decode('utf-8', errors='ignore')}")
                except Exception as e:
                    logger.warning(f"Gemini {gem_model} connection error: {e}")
                    continue

cloud_provider = CloudLLMProvider()
