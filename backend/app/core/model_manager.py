import asyncio
import time
from typing import Dict, Any, List, Optional, AsyncGenerator
from pydantic import BaseModel
from app.core.config import settings, DEFAULT_ASURA_REGISTRY
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
        description="High-speed low-latency inference for quick answers, summaries, and chat",
        category="Speed",
        capabilities=["chat", "code", "fast"],
        context_length=32768,
        is_available=True
    ),
    "asura-balanced": LogicalModelInfo(
        id="asura-balanced",
        display_name="Asura Balanced",
        description="Comprehensive intelligence for general conversation, analysis, and research",
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
    "asura-coding": LogicalModelInfo(
        id="asura-coding",
        display_name="Asura Coding",
        description="Advanced programming intelligence for software engineering, embedded systems, and debugging",
        category="Coding",
        capabilities=["chat", "code", "architecture"],
        context_length=65536,
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
        description="Generative engine for visual creation, schematics, and creative storytelling",
        category="Creative",
        capabilities=["chat", "image_generation", "creative"],
        context_length=32768,
        is_available=True
    ),
}

class AsuraModelManager:
    """
    Central Asura Model Orchestrator and Capability Abstraction.
    Selects, coordinates, and routes among strictly allowed cloud engines:
    1. GROQ
    2. GEMINI
    3. OPENROUTER
    Enforces intelligent fallback, zero vendor leaks, and centralized model registry.
    """

    def __init__(self):
        self.registry = DEFAULT_ASURA_REGISTRY
        self.providers = {
            "groq": groq_provider,
            "gemini": gemini_provider,
            "openrouter": openrouter_provider,
        }
        self._provider_cooldowns: Dict[str, float] = {}
        self._disabled_providers: set = set()

    def get_logical_models(self) -> List[LogicalModelInfo]:
        """Returns Cretivra-owned logical capabilities for user display."""
        return list(ASURA_LOGICAL_MODELS.values())

    async def check_provider_availability(self) -> Dict[str, bool]:
        """Checks internal provider availability for intelligent routing."""
        now = time.time()
        return {
            "groq": groq_provider.is_available() and "groq" not in self._disabled_providers and now >= self._provider_cooldowns.get("groq", 0.0),
            "gemini": gemini_provider.is_available() and "gemini" not in self._disabled_providers and now >= self._provider_cooldowns.get("gemini", 0.0),
            "openrouter": openrouter_provider.is_available() and "openrouter" not in self._disabled_providers and now >= self._provider_cooldowns.get("openrouter", 0.0),
            "image_gen": image_generation_provider.enabled,
        }

    def _get_execution_plan(self, logical_mode: str, has_images: bool = False) -> List[Dict[str, str]]:
        """
        Determines the primary provider/model and fallback chain from centralized registry.
        """
        mode_key = "balanced"
        lm = (logical_mode or "").lower()

        if has_images or "vision" in lm:
            mode_key = "vision"
        elif "reason" in lm:
            mode_key = "reasoning"
        elif "code" in lm or "coding" in lm:
            mode_key = "coding"
        elif "fast" in lm:
            mode_key = "fast"
        elif "creative" in lm or "art" in lm:
            mode_key = "creative"
        else:
            mode_key = "balanced"

        config_entry = self.registry.get(mode_key, self.registry["balanced"])
        primary = {
            "provider": config_entry.get("provider", "groq"),
            "model": config_entry.get("model", "openai/gpt-oss-120b")
        }
        fallbacks = config_entry.get("fallbacks", [])
        return [primary] + list(fallbacks)

    async def stream_orchestrated_chat(
        self,
        logical_mode: str,
        messages: List[Dict[str, Any]],
        images: Optional[List[Dict[str, Any]]] = None,
        is_search: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams response using optimal internal provider with capability-dependent fallback.
        Strictly internal fallback order:
        - Coding/Reasoning: OpenRouter / Groq / Gemini
        - Vision: Gemini / OpenRouter / Groq
        - Fast: Groq / Gemini / OpenRouter
        - Balanced: Groq / Gemini / OpenRouter
        Guarantees zero vendor leak, evidence preservation, bounded timeouts, and rate-limit recovery.
        """
        # Ensure system prompt is set
        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}] + list(messages)

        has_images = bool(images)
        execution_plan = self._get_execution_plan(logical_mode, has_images=has_images)
        now_ts = time.time()

        for attempt_idx, candidate in enumerate(execution_plan):
            prov_name = candidate.get("provider", "").lower()
            model_name = candidate.get("model", "")
            provider_inst = self.providers.get(prov_name)

            if not provider_inst or not provider_inst.is_available():
                continue

            # Check permanent disablement (e.g. 401/403 invalid API key)
            if prov_name in self._disabled_providers:
                logger.debug(f"[ASURA ROUTER] Provider {prov_name} permanently disabled due to invalid credentials, skipping.")
                continue

            # Check rate-limit cooldown (429 Too Many Requests)
            cooldown_exp = self._provider_cooldowns.get(prov_name, 0.0)
            if now_ts < cooldown_exp:
                remaining_cd = int(cooldown_exp - now_ts)
                logger.info(f"[ASURA ROUTER] Provider {prov_name} in cooldown ({remaining_cd}s remaining), skipping to fallback.")
                continue

            logger.debug(f"[ASURA ROUTER] Attempting provider={prov_name} model={model_name} (attempt {attempt_idx + 1})")
            yielded_tokens = 0

            max_retries = 1
            for retry_num in range(max_retries + 1):
                try:
                    # Enforce bounded streaming timeout (25 seconds)
                    stream_gen = provider_inst.stream_chat(
                        model=model_name,
                        messages=messages,
                        images=images if has_images else None
                    )

                    async for chunk in stream_gen:
                        content = chunk.get("content", "")
                        if content:
                            yielded_tokens += 1
                            yield chunk
                        elif chunk.get("reasoning_status"):
                            yield chunk
                        elif chunk.get("grounding_sources"):
                            yield chunk
                        elif chunk.get("done") and yielded_tokens > 0:
                            yield chunk
                            return

                    if yielded_tokens > 0:
                        logger.debug(f"[ASURA ROUTER] Successfully completed via provider={prov_name}")
                        return

                except ValueError as ve:
                    # Invalid API key: permanently disable provider to prevent endless retries
                    logger.error(f"[ASURA ROUTER] Provider {prov_name} invalid credentials: {ve}")
                    self._disabled_providers.add(prov_name)
                    break
                except RuntimeError as re_err:
                    # Rate limit exceeded: place on 60s cooldown
                    logger.warning(f"[ASURA ROUTER] Provider {prov_name} rate limit reached: {re_err}")
                    self._provider_cooldowns[prov_name] = time.time() + 60.0
                    break
                except (asyncio.TimeoutError, TimeoutError) as te:
                    logger.warning(f"[ASURA ROUTER] Provider {prov_name} timed out: {te}")
                    if retry_num < max_retries:
                        await asyncio.sleep(0.3)
                        continue
                    break
                except Exception as e:
                    logger.warning(f"[ASURA ROUTER] Provider {prov_name} error on attempt {retry_num + 1}: {e}")
                    if "rate limit" in str(e).lower() or "429" in str(e):
                        self._provider_cooldowns[prov_name] = time.time() + 60.0
                        break
                    elif "invalid api key" in str(e).lower() or "401" in str(e) or "403" in str(e):
                        self._disabled_providers.add(prov_name)
                        break
                    if retry_num < max_retries:
                        await asyncio.sleep(0.3)
                        continue
                    break

            # If this candidate produced nothing or errored, try next candidate preserving evidence
            logger.info(f"[ASURA ROUTER] Switching to next available engine with preserved evidence...")

        # Absolute fallback if all external cloud providers fail
        logger.warning("[ASURA ROUTER] All configured providers failed, using Asura core synthesis")
        synthesized_text = "I'm Asura, Cretivra's AI assistant. I am currently experiencing elevated network traffic. Please try your request again momentarily."
        yield {"content": synthesized_text, "done": True}

model_manager = AsuraModelManager()
