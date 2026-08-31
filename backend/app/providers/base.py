from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

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
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass
