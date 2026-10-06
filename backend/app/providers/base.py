from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional, Tuple

class BaseLLMProvider(ABC):
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def list_models(self) -> List[str]:
        pass

    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None,
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass


class BaseSearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        pass


class BaseImageSearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for real images matching the query.
        Returns list of dicts with:
        url, thumbnail, title, source_url, source_domain, attribution
        """
        pass

    @abstractmethod
    async def validate_result(self, result: Dict[str, Any]) -> bool:
        """Validates that candidate image result has real URL and legitimate source."""
        pass

    @abstractmethod
    async def get_image_details(self, image_id: str) -> Optional[Dict[str, Any]]:
        pass


class BaseImageGenerationProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        style: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates a new image matching prompt.
        Returns: {url, thumbnail, prompt, provider_meta}
        """
        pass


class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        """Transcribes user spoken audio into text."""
        pass


class BaseTTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice: Optional[str] = "Breeze") -> Optional[str]:
        """Synthesizes text into audio data URL or audio bytes."""
        pass
