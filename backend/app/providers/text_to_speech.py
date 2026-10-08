import re
import base64
import struct
import httpx
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseTTSProvider

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

class TextToSpeechProvider(BaseTTSProvider):
    """
    Internal Text-to-Speech Provider for Asura AI by Cretivra.
    Synthesizes natural, articulate speech using Google Gemini Flash TTS.
    """
    def __init__(self):
        self.enabled = getattr(settings, "TTS_ENABLED", True)

    async def synthesize(self, text: str, voice: Optional[str] = "Breeze") -> Optional[str]:
        if not self.enabled or not text or not text.strip():
            return None

        clean_text = self._clean_spoken_text(text)
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        if not gemini_key:
            return None

        clean_key = re.sub(r'[\r\n\t ]+', '', gemini_key)
        voice_name = voice or "Breeze"

        tts_models = [
            "gemini-2.5-flash-preview-tts",
            "gemini-2.5-pro-preview-tts"
        ]

        payload = {
            "contents": [
                {
                    "parts": [{"text": clean_text[:600]}]
                }
            ],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": voice_name
                        }
                    }
                }
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            for model_name in tts_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
                try:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                if "inlineData" in part:
                                    b64_data = part["inlineData"].get("data", "")
                                    mime_type = part["inlineData"].get("mimeType", "")
                                    if b64_data:
                                        raw_audio = base64.b64decode(b64_data)
                                        if "pcm" in mime_type.lower() or not mime_type.startswith("audio/wav"):
                                            wav_bytes = pcm_to_wav(raw_audio, sample_rate=24000)
                                            b64_wav = base64.b64encode(wav_bytes).decode("utf-8")
                                            return f"data:audio/wav;base64,{b64_wav}"
                                        else:
                                            return f"data:{mime_type};base64,{b64_data}"
                except Exception as e:
                    logger.debug(f"TTS attempt ({model_name}) notice: {e}")
                    continue

        return None

    def _clean_spoken_text(self, text: str) -> str:
        text = re.sub(r'[*_#`~]', '', text)
        text = re.sub(r'^\s*[-•]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\[.*?\]\(.*?\)', '', text)
        text = re.sub(r'\(http\S+\)', '', text)
        return re.sub(r'\s+', ' ', text).strip()

tts_provider = TextToSpeechProvider()
