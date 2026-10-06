from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

class AIProvider(ABC):
    """
    Common Unified AI Provider interface for CRETIVRA ASURA.
    Implemented by GeminiProvider, GroqProvider, and OpenRouterProvider.
    """
    @abstractmethod
    def is_available(self) -> bool:
        """Checks if provider has valid configured credentials."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Checks provider connectivity and health status."""
        pass

    @abstractmethod
    async def list_models(self) -> List[str]:
        """Lists available models from the provider."""
        pass

    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Synchronous non-streaming chat request."""
        pass

    @abstractmethod
    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None,
        images: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming chat request yielding chunks: {content, reasoning_status, done}."""
        pass

    async def structured_response(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Structured chat response helper."""
        return await self.chat(model, messages, options=options)

# Backward-compatible alias
BaseLLMProvider = AIProvider

class BaseImageSearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for real images matching query.
        Returns list of dicts with:
        url, thumbnailUrl, title, sourceUrl, sourceName, attribution, width, height
        """
        pass

    @abstractmethod
    async def validate_result(self, result: Dict[str, Any]) -> bool:
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
        pass

class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        pass

class BaseTTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice: Optional[str] = "Breeze") -> Optional[str]:
        pass
