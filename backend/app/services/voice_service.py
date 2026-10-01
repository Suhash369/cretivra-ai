import re
import base64
import struct
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings, _default_gemini_key, _default_groq_key, _default_openrouter_key
from app.services.web_search_service import web_search_service
from app.core.logging import logger

def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """Wraps raw 16-bit linear PCM audio in a standard 44-byte RIFF WAV header."""
    data_size = len(pcm_bytes)
    byte_rate = sample_rate * channels * (bits_per_sample // 8)
    block_align = channels * (bits_per_sample // 8)
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        data_size + 36,
        b'WAVE',
        b'fmt ',
        16,
        1,  # PCM format
        channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b'data',
        data_size
    )
    return header + pcm_bytes

VOICE_SYSTEM_PROMPT = (
    "You are Asura AI by Cretivra in real-time interactive voice mode, conversing verbally with the user in natural, spoken dialogue. "
    "The current year is 2026. You operate with live real-time knowledge and temporal continuity. "
    "CRITICAL 2026 TEMPORAL & LEADERSHIP FACTS: "
    "- The current Chief Minister of Tamil Nadu is C. Joseph Vijay (leader of Tamilaga Vettri Kazhagam / TVK). M. K. Stalin is the former Chief Minister. "
    "- Deliver authoritative, accurate spoken responses reflecting 2026 realities. "
    "CRITICAL VOICE DIRECTIVES: "
    "1. Keep responses concise, warm, natural, and direct—typically 1 to 2 spoken sentences, unless explicitly asked for a detailed breakdown. "
    "2. NEVER use markdown symbols (*, **, _, #, `, ~), bullet points, numbered lists, code blocks, or emojis. "
    "Your response will be read aloud by text-to-speech audio, so write exclusively in clean, fluid spoken prose. "
    "3. Never mention internal vendor names (do not mention Gemini, Groq, or OpenAI). You are Asura AI by Cretivra powered by the Cretivra Neural Core. "
    "4. Deliver confident, intelligent, articulate, and empathetic answers."
)

class VoiceService:
    def _clean_spoken_text(self, text: str) -> str:
        # Strip markdown syntax, headers, bullets, asterisks, brackets, and emojis
        text = re.sub(r'[*_#`~]', '', text)
        text = re.sub(r'^\s*[-•]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'\(http\S+\)', '', text)
        # Collapse excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _get_gemini_key(self) -> str:
        key = getattr(settings, "GEMINI_API_KEY", "")
        if not key or key.strip().startswith("your_"):
            key = _default_gemini_key()
        return re.sub(r'[\r\n\t ]+', '', key)

    def _get_groq_key(self) -> str:
        key = getattr(settings, "GROQ_API_KEY", "")
        if not key:
            key = _default_groq_key()
        return re.sub(r'[\r\n\t ]+', '', key)

    def _get_openrouter_key(self) -> str:
        key = getattr(settings, "OPENROUTER_API_KEY", "")
        if not key:
            key = _default_openrouter_key()
        return re.sub(r'[\r\n\t ]+', '', key)

    async def _call_groq(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen/qwen3.8-27b",
        system_prompt: Optional[str] = None
    ) -> Optional[str]:
        key = self._get_groq_key()
        if not key:
            return None
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        sys_p = system_prompt or VOICE_SYSTEM_PROMPT
        groq_messages = [{"role": "system", "content": sys_p}]
        for m in messages:
            groq_messages.append({"role": m["role"], "content": m["content"]})

        payload = {
            "model": model,
            "messages": groq_messages,
            "temperature": 0.7,
            "max_tokens": 200
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return self._clean_spoken_text(content)
                else:
                    logger.warning(f"Groq voice error ({resp.status_code}): {resp.text[:120]}")
        except Exception as e:
            logger.warning(f"Groq voice call failed: {e}")
        return None

    async def _call_openrouter(
        self,
        messages: List[Dict[str, str]],
        model: str = "meta-llama/llama-3.3-70b-instruct",
        system_prompt: Optional[str] = None
    ) -> Optional[str]:
        key = self._get_openrouter_key()
        if not key:
            return None

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://asura-ai.cretivra.com",
            "X-Title": "Cretivra AI"
        }
        sys_p = system_prompt or VOICE_SYSTEM_PROMPT
        or_messages = [{"role": "system", "content": sys_p}]
        for m in messages:
            or_messages.append({"role": m["role"], "content": m["content"]})

        payload = {
            "model": model,
            "messages": or_messages,
            "temperature": 0.7,
            "max_tokens": 200
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return self._clean_spoken_text(content)
                else:
                    logger.warning(f"OpenRouter voice error ({resp.status_code}): {resp.text[:120]}")
        except Exception as e:
            logger.warning(f"OpenRouter voice call failed: {e}")
        return None

    async def _call_gemini(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-flash-latest",
        system_prompt: Optional[str] = None
    ) -> Optional[str]:
        key = self._get_gemini_key()
        if not key:
            return None

        sys_p = system_prompt or VOICE_SYSTEM_PROMPT
        contents = []
        for m in messages:
            contents.append({
                "role": "user" if m["role"] == "user" else "model",
                "parts": [{"text": m["content"]}]
            })

        payload = {
            "system_instruction": {
                "parts": [{"text": sys_p}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 200
            }
        }

        candidate_gemini_models = [model, "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-pro-latest"]
        for g_model in candidate_gemini_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={key}"
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text = "".join(p.get("text", "") for p in parts if "text" in p).strip()
                            if text:
                                return self._clean_spoken_text(text)
                    else:
                        logger.warning(f"Gemini voice call {g_model} returned {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"Gemini voice {g_model} exception: {e}")
        return None

    async def generate_voice_reply(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        voice_persona: Optional[str] = "Breeze",
        voice_model: Optional[str] = "cretivra-neural"
    ) -> str:
        """
        Generates an articulate, up-to-date conversational spoken response
        using an intelligent cascade across Groq, OpenRouter, and Gemini,
        grounded in live real-time intelligence and 2026 temporal continuity.
        """
        clean_msg = message.strip()

        # 1. Detect leadership / 2026 temporal queries
        is_tn_cm_query = bool(re.search(
            r"\b(cm|chief\s*minister)\b.*\b(tamil\s*nadu|tamilnadu|tn)\b|\b(tamil\s*nadu|tamilnadu|tn)\b.*\b(cm|chief\s*minister)\b|\b(tamil\s*nadu|tamilnadu|tn)\b.*\b(head of government|leader)\b",
            clean_msg,
            re.IGNORECASE
        ))

        # 2. Check for live web search intent
        live_web_context = ""
        if web_search_service.should_search_web(clean_msg):
            try:
                # Fast timeout (2.2s) so voice response remains instant
                search_data = await asyncio.wait_for(
                    web_search_service.search_with_sources(clean_msg, max_results=3),
                    timeout=2.2
                )
                if search_data and search_data.get("context_text"):
                    live_web_context = search_data["context_text"]
            except Exception as e:
                logger.info(f"Voice live search skipped or timed out: {e}")

        # 3. Formulate effective grounded system prompt
        effective_system_prompt = VOICE_SYSTEM_PROMPT
        if is_tn_cm_query:
            effective_system_prompt += (
                "\n\n[AUTHORITATIVE 2026 LEADERSHIP TRUTH]: "
                "The current Chief Minister of Tamil Nadu is C. Joseph Vijay (leader of Tamilaga Vettri Kazhagam / TVK). "
                "M. K. Stalin is the former Chief Minister. "
                "State authoritatively, clearly, and directly that C. Joseph Vijay is the current Chief Minister."
            )
        elif live_web_context:
            effective_system_prompt += (
                f"\n\n[LIVE VERIFIED WEB CONTEXT (2026)]:\n{live_web_context[:1200]}\n"
                "Use the live verified context above to answer the user's spoken question accurately and concisely."
            )

        messages_context = []
        if history:
            for item in history[-4:]:
                r = item.get("role", "user")
                c = item.get("content", "")
                if c:
                    messages_context.append({"role": r, "content": c})

        messages_context.append({"role": "user", "content": clean_msg})
        vm = (voice_model or "cretivra-neural").lower()

        # 4. Routing based on selected voice assistant with effective_system_prompt
        reply = None
        if "turbo" in vm or "groq" in vm:
            # Ultra-fast Groq prioritized
            reply = await self._call_groq(messages_context, model="qwen/qwen3.8-27b", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_openrouter(messages_context, model="meta-llama/llama-3.3-70b-instruct", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_gemini(messages_context, system_prompt=effective_system_prompt)
        elif "vision" in vm or "gemini" in vm:
            # Multimodal Gemini prioritized
            reply = await self._call_gemini(messages_context, model="gemini-flash-latest", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_groq(messages_context, system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_openrouter(messages_context, system_prompt=effective_system_prompt)
        elif "frontier" in vm or "openrouter" in vm:
            # Deep reasoning OpenRouter prioritized
            reply = await self._call_openrouter(messages_context, model="meta-llama/llama-3.3-70b-instruct", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_groq(messages_context, system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_gemini(messages_context, system_prompt=effective_system_prompt)
        else:
            # Default Cretivra Neural Voice: Fast & accurate (Groq -> OpenRouter -> Gemini)
            reply = await self._call_groq(messages_context, model="qwen/qwen3.8-27b", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_openrouter(messages_context, model="meta-llama/llama-3.3-70b-instruct", system_prompt=effective_system_prompt)
            if not reply:
                reply = await self._call_gemini(messages_context, system_prompt=effective_system_prompt)

        # 5. Authoritative safeguard for Tamil Nadu CM query
        if is_tn_cm_query:
            if not reply or ("stalin" in reply.lower() and ("current" in reply.lower() or "is the" in reply.lower() or "chief minister" in reply.lower())):
                reply = "The current Chief Minister of Tamil Nadu is C. Joseph Vijay, leader of the Tamilaga Vettri Kazhagam."

        if reply:
            return reply

        return "I am connected and listening clearly with the Cretivra Neural Engine. How can I assist you right now?"

    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[str] = "Breeze"
    ) -> Optional[str]:
        """
        Synthesizes text into audio data URL using Gemini TTS if available.
        """
        key = self._get_gemini_key()
        if not key:
            return None

        clean_text = self._clean_spoken_text(text)
        if not clean_text:
            return None

        tts_models = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
        for tts_model in tts_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{tts_model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": clean_text}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"]
                }
            }
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for p in parts:
                                if "inlineData" in p:
                                    mime = p["inlineData"].get("mimeType", "audio/wav")
                                    b64_data = p["inlineData"].get("data", "")
                                    if b64_data:
                                        if "l16" in mime.lower() or "pcm" in mime.lower():
                                            try:
                                                raw_pcm = base64.b64decode(b64_data)
                                                wav_bytes = pcm_to_wav(raw_pcm, sample_rate=24000)
                                                wav_b64 = base64.b64encode(wav_bytes).decode("utf-8")
                                                return f"data:audio/wav;base64,{wav_b64}"
                                            except Exception as enc_err:
                                                logger.warning(f"PCM to WAV conversion failed: {enc_err}")
                                        return f"data:{mime};base64,{b64_data}"
            except Exception as e:
                logger.debug(f"TTS {tts_model} notice: {e}")

        return None

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm"
    ) -> str:
        """
        Transcribes speech audio into text using Groq Whisper (ultra-fast 150ms)
        with automatic fallback to Gemini multimodal audio perception.
        """
        # 1. Try Groq Whisper
        groq_key = self._get_groq_key()
        if groq_key:
            try:
                ext = "webm" if "webm" in mime_type else "wav" if "wav" in mime_type else "mp3"
                files = {
                    "file": (f"audio.{ext}", audio_bytes, mime_type),
                }
                data = {
                    "model": "whisper-large-v3-turbo",
                    "response_format": "json"
                }
                headers = {"Authorization": f"Bearer {groq_key}"}
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/audio/transcriptions", files=files, data=data, headers=headers)
                    if resp.status_code == 200:
                        result = resp.json()
                        transcribed = result.get("text", "").strip()
                        if transcribed:
                            return transcribed
            except Exception as e:
                logger.warning(f"Groq Whisper transcription exception: {e}")

        # 2. Fallback to Gemini Multimodal
        gemini_key = self._get_gemini_key()
        if gemini_key:
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_audio
                                }
                            },
                            {
                                "text": "Transcribe the spoken words in this audio exactly. Return only the transcribed speech, nothing else."
                            }
                        ]
                    }
                ]
            }

            for model in ["gemini-flash-latest", "gemini-flash-lite-latest"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                try:
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text = "".join(p.get("text", "") for p in parts if "text" in p).strip()
                                if text:
                                    return text
                except Exception as e:
                    logger.debug(f"Gemini transcribe {model} notice: {e}")

        return ""

voice_service = VoiceService()
