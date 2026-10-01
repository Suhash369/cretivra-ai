import re
import base64
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings, _default_gemini_key
from app.core.logging import logger

VOICE_SYSTEM_PROMPT = (
    "You are Asura AI by Cretivra in real-time interactive voice mode, conversing verbally with the user in natural speech. "
    "Guidelines for voice output: "
    "1. Keep responses concise, natural, warm, and direct—typically 1 to 3 spoken sentences, unless explicitly asked for an in-depth breakdown. "
    "2. Never use Markdown formatting, bullet points, numbered lists, asterisks, bold tags, hashes, code blocks, or emojis, "
    "because your reply will be synthesized directly into natural speech audio and read aloud to the user. "
    "3. Speak with confidence, intelligence, and empathy. The year is 2026."
)

class VoiceService:
    def __init__(self):
        pass

    def _get_api_key(self) -> str:
        key = getattr(settings, "GEMINI_API_KEY", "")
        if not key or key.strip().startswith("your_"):
            key = _default_gemini_key()
        return re.sub(r'[\r\n\t ]+', '', key)

    async def generate_voice_reply(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        voice_persona: Optional[str] = "Breeze"
    ) -> str:
        """
        Generates a natural, conversational response using Gemini designed specifically for spoken speech.
        """
        key = self._get_api_key()
        if not key:
            return "I am ready to speak with you. How can I assist you today?"

        contents = []
        if history:
            for item in history[-6:]:  # Keep recent context
                role = item.get("role", "user")
                txt = item.get("content", "")
                if txt:
                    contents.append({
                        "role": "user" if role == "user" else "model",
                        "parts": [{"text": txt}]
                    })

        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": VOICE_SYSTEM_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 350
            }
        }

        candidate_models = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text = "".join(p.get("text", "") for p in parts if "text" in p).strip()
                            if text:
                                # Clean any remaining markdown / asterisks
                                text = re.sub(r'[*_#`~]', '', text).strip()
                                return text
                    else:
                        logger.warning(f"Voice generation with {model} failed ({resp.status_code}): {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"Voice model {model} error: {e}")

        return "I heard you clearly. I am processing your thought with the Cretivra Neural Core. Tell me more."

    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[str] = "Puck"
    ) -> Optional[str]:
        """
        Synthesizes text into high-fidelity audio (WAV) data URL using Gemini Flash TTS.
        """
        key = self._get_api_key()
        if not key:
            return None

        # Clean text for speech
        clean_text = re.sub(r'[*_#`~]', '', text).strip()
        if not clean_text:
            return None

        tts_models = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-2.5-flash-preview-tts"]
        for tts_model in tts_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{tts_model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": clean_text}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"]
                }
            }
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
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
                                        return f"data:{mime};base64,{b64_data}"
                    else:
                        logger.warning(f"TTS {tts_model} returned {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"TTS {tts_model} exception: {e}")

        return None

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm"
    ) -> str:
        """
        Transcribes speech audio into text using Gemini multimodal audio perception.
        """
        key = self._get_api_key()
        if not key:
            return ""

        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        transcribe_models = ["gemini-3.5-transcribe", "gemini-3.1-flash-lite", "gemini-3.5-flash"]

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

        for model in transcribe_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text = "".join(p.get("text", "") for p in parts if "text" in p).strip()
                            if text:
                                return text
                    else:
                        logger.warning(f"Audio transcribe {model} failed ({resp.status_code}): {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"Audio transcribe {model} error: {e}")

        return ""

voice_service = VoiceService()
