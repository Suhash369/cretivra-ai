import re
import base64
import httpx
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseSTTProvider

class SpeechToTextProvider(BaseSTTProvider):
    """
    Internal Speech-to-Text Provider for Asura AI by Cretivra.
    Supports Google Gemini multimodal audio transcription and Groq Whisper fallback.
    """
    def __init__(self):
        self.enabled = getattr(settings, "STT_ENABLED", True)

    async def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        if not self.enabled or not audio_bytes:
            return ""

        # 1. Try Gemini Multimodal Audio Perception
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if gemini_key:
            try:
                text = await self._transcribe_gemini(audio_bytes, mime_type)
                if text and text.strip():
                    return text.strip()
            except Exception as e:
                logger.debug(f"Gemini audio perception notice: {e}")

        # 2. Try Groq Whisper API
        groq_key = getattr(settings, "GROQ_API_KEY", "")
        if groq_key:
            try:
                text = await self._transcribe_groq(audio_bytes, mime_type)
                if text and text.strip():
                    return text.strip()
            except Exception as e:
                logger.debug(f"Groq Whisper transcription notice: {e}")

        return ""

    async def _transcribe_gemini(self, audio_bytes: bytes, mime_type: str) -> str:
        clean_key = re.sub(r'[\r\n\t ]+', '', settings.GEMINI_API_KEY)
        b64 = base64.b64encode(audio_bytes).decode("utf-8")
        clean_mime = mime_type.split(";")[0].strip() or "audio/webm"

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "Transcribe the spoken audio with exact accuracy. Output exclusively the transcription text, nothing else."
                        },
                        {
                            "inline_data": {
                                "mime_type": clean_mime,
                                "data": b64
                            }
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={clean_key}",
                json=payload
            )
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
        return ""

    async def _transcribe_groq(self, audio_bytes: bytes, mime_type: str) -> str:
        groq_key = getattr(settings, "GROQ_API_KEY", "")
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {groq_key}"}
        ext = "webm" if "webm" in mime_type else "wav"
        files = {"file": (f"speech.{ext}", audio_bytes, mime_type)}
        data = {"model": "whisper-large-v3-turbo"}

        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(url, headers=headers, files=files, data=data)
            if res.status_code == 200:
                return res.json().get("text", "")
        return ""

stt_provider = SpeechToTextProvider()
