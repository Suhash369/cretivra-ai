import asyncio
from typing import Dict, Any, List, Optional, AsyncGenerator
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger
from app.providers.groq import groq_provider
from app.providers.gemini import gemini_provider
from app.providers.openrouter import openrouter_provider
from app.providers.image_generation import image_generation_provider

class LogicalModelInfo(BaseModel):
    id: str
    display_name: str
    description: str
    category: str
    capabilities: List[str]
    context_length: int
    is_available: bool = True

ASURA_LOGICAL_MODELS: Dict[str, LogicalModelInfo] = {
    "asura-fast": LogicalModelInfo(
        id="asura-fast",
        display_name="Asura Fast",
        description="High-speed low-latency inference for quick answers and code",
        category="Speed",
        capabilities=["chat", "code", "fast"],
        context_length=32768,
        is_available=True
    ),
    "asura-balanced": LogicalModelInfo(
        id="asura-balanced",
        display_name="Asura Balanced",
        description="Comprehensive intelligence for general conversational and analytical tasks",
        category="Balanced",
        capabilities=["chat", "code", "web", "reasoning"],
        context_length=128000,
        is_available=True
    ),
    "asura-reasoning": LogicalModelInfo(
        id="asura-reasoning",
        display_name="Asura Reasoning",
        description="Deep chain-of-thought analysis for complex math, logic, and architecture",
        category="Reasoning",
        capabilities=["chat", "deep_research", "math", "architecture"],
        context_length=128000,
        is_available=True
    ),
    "asura-vision": LogicalModelInfo(
        id="asura-vision",
        display_name="Asura Vision",
        description="Multimodal visual intelligence for analyzing images, circuit schematics, and diagrams",
        category="Multimodal",
        capabilities=["chat", "vision", "ocr"],
        context_length=128000,
        is_available=True
    ),
    "asura-creative": LogicalModelInfo(
        id="asura-creative",
        display_name="Asura Creative",
        description="Generative engine for visual creation, schematics, and artistic media",
        category="Creative",
        capabilities=["chat", "image_generation", "creative"],
        context_length=32768,
        is_available=True
    ),
}

class AsuraModelManager:
    """
    Central Asura Model Orchestrator and Capability Abstraction.
    Selects, coordinates, and routes among local Ollama and configured cloud engines (Groq, Gemini, OpenRouter).
    Guarantees that third-party infrastructure remains an internal detail.
    """

    def get_logical_models(self) -> List[LogicalModelInfo]:
        """Returns Cretivra-owned logical capabilities for user display."""
        return list(ASURA_LOGICAL_MODELS.values())

    async def check_provider_availability(self) -> Dict[str, bool]:
        """Checks internal provider availability for intelligent routing."""
        ollama_available = False
        try:
            from app.providers.cretivra_provider import ollama_provider
            health = await asyncio.wait_for(ollama_provider.health_check(), timeout=1.0)
            ollama_available = health.get("available", False)
        except Exception:
            ollama_available = False

        return {
            "local_ai": ollama_available,
            "groq": groq_provider.is_available(),
            "gemini": gemini_provider.is_available(),
            "openrouter": openrouter_provider.is_available(),
            "image_gen": image_generation_provider.enabled,
        }

    async def stream_orchestrated_chat(
        self,
        logical_mode: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None,
        is_search: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams response using optimal internal provider with seamless automatic fallback.
        Falls back through: Local AI -> Groq -> Gemini -> OpenRouter -> Synthesizer.
        Never crashes, never leaks vendor names.
        """
        # Normalize messages with system prompt if not present
        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}] + list(messages)

        # 1. Vision Intent: Route directly to vision-capable cloud or local models
        if images:
            if gemini_provider.is_available():
                try:
                    has_yielded = False
                    async for chunk in gemini_provider.stream_chat("gemini-2.5-flash", messages, images=images):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.debug(f"Gemini vision fallback notice: {e}")

            if openrouter_provider.is_available():
                try:
                    has_yielded = False
                    async for chunk in openrouter_provider.stream_chat("nex-agi/nex-n2.5-pro:free", messages, images=images):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.debug(f"OpenRouter vision fallback notice: {e}")

        # 2. Reasoning Intent: Route to deep reasoning models
        if "reason" in logical_mode.lower():
            if openrouter_provider.is_available():
                try:
                    has_yielded = False
                    async for chunk in openrouter_provider.stream_chat("deepseek/deepseek-r1", messages):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.debug(f"Reasoning provider notice: {e}")

            if groq_provider.is_available():
                try:
                    has_yielded = False
                    async for chunk in groq_provider.stream_chat("openai/gpt-oss-120b", messages):
                        has_yielded = True
                        yield chunk
                    if has_yielded:
                        return
                except Exception as e:
                    logger.debug(f"Groq reasoning fallback notice: {e}")

        # 3. Fast Intent or General Balanced: Groq Ultra-Low Latency (~300 tok/sec)
        if groq_provider.is_available():
            try:
                target_groq_model = "openai/gpt-oss-20b" if "fast" in logical_mode.lower() else "openai/gpt-oss-120b"
                has_yielded = False
                async for chunk in groq_provider.stream_chat(target_groq_model, messages):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.debug(f"Groq stream fallback notice: {e}")

        # 4. Gemini Fallback
        if gemini_provider.is_available():
            try:
                has_yielded = False
                async for chunk in gemini_provider.stream_chat("gemini-flash-lite-latest", messages):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.debug(f"Gemini stream fallback notice: {e}")

        # 5. OpenRouter Fallback
        if openrouter_provider.is_available():
            try:
                has_yielded = False
                async for chunk in openrouter_provider.stream_chat("nex-agi/nex-n2.5-mini:free", messages):
                    has_yielded = True
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                logger.debug(f"OpenRouter stream fallback notice: {e}")

        # 6. Fallback internal synthesized message
        from app.providers.cloud_provider import cloud_provider
        async for chunk in cloud_provider._stream_synthesized_response(messages, images=images):
            yield chunk

model_manager = AsuraModelManager()
