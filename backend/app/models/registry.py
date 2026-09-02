from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class CretivraModel(BaseModel):
    id: str
    display_name: str
    description: str
    provider: str = "ollama"
    underlying_model: str
    capabilities: List[str] = ["chat"]
    context_length: int = 8192
    enabled: bool = True
    version: str = "1.0"
    icon: Optional[str] = None
    category: str = "General"
    is_available: bool = True  # Computed at runtime based on Ollama tags / mock mode

DEFAULT_MODEL_REGISTRY: Dict[str, CretivraModel] = {
    "cretivra-1": CretivraModel(
        id="cretivra-1",
        display_name="Cretivra 1",
        description="General-purpose intelligent assistant",
        provider="ollama",
        underlying_model="llama3",
        capabilities=["chat", "code"],
        context_length=8192,
        enabled=True,
        version="1.0",
        category="Balanced"
    ),
    "cretivra-1.1": CretivraModel(
        id="cretivra-1.1",
        display_name="Cretivra 1.1",
        description="Advanced general reasoning and chat assistant",
        provider="ollama",
        underlying_model="llama3.1",
        capabilities=["chat", "code", "multimodal"],
        context_length=128000,
        enabled=True,
        version="1.1",
        category="Advanced"
    ),
    "cretivra-1.2": CretivraModel(
        id="cretivra-1.2",
        display_name="Cretivra 1.2",
        description="Lightweight high-efficiency model",
        provider="ollama",
        underlying_model="llama3.2",
        capabilities=["chat", "fast"],
        context_length=128000,
        enabled=True,
        version="1.2",
        category="Fast"
    ),
    "cretivra-q": CretivraModel(
        id="cretivra-q",
        display_name="Cretivra Q",
        description="Ultra-fast multilingual and code synthesis AI",
        provider="ollama",
        underlying_model="qwen2.5",
        capabilities=["chat", "code", "multilingual"],
        context_length=32768,
        enabled=True,
        version="2.5",
        category="Code & Fast"
    ),
    "cretivra-m": CretivraModel(
        id="cretivra-m",
        display_name="Cretivra M",
        description="High performance creative and reasoning engine",
        provider="ollama",
        underlying_model="mistral",
        capabilities=["chat", "creative"],
        context_length=32768,
        enabled=True,
        version="0.3",
        category="Creative"
    ),
    "cretivra-g": CretivraModel(
        id="cretivra-g",
        display_name="Cretivra G",
        description="Efficient lightweight conversational AI",
        provider="ollama",
        underlying_model="gemma",
        capabilities=["chat"],
        context_length=8192,
        enabled=True,
        version="2.0",
        category="Balanced"
    ),
    "cretivra-p": CretivraModel(
        id="cretivra-p",
        display_name="Cretivra P",
        description="Compact logic and analysis specialist",
        provider="ollama",
        underlying_model="phi",
        capabilities=["chat", "logic"],
        context_length=4096,
        enabled=True,
        version="3.0",
        category="Compact"
    ),
    "cretivra-reason": CretivraModel(
        id="cretivra-reason",
        display_name="Cretivra Reason",
        description="Deep step-by-step reasoning and problem-solving model",
        provider="ollama",
        underlying_model="deepseek-r1",
        capabilities=["chat", "reasoning", "code"],
        context_length=65536,
        enabled=True,
        version="1.0",
        category="Reasoning"
    ),
    "cretivra-coder": CretivraModel(
        id="cretivra-coder",
        display_name="Cretivra Coder Pro",
        description="State-of-the-art coding, full-stack architecture, and debugging specialist",
        provider="ollama",
        underlying_model="qwen2.5-coder:32b",
        capabilities=["chat", "code", "architecture"],
        context_length=131072,
        enabled=True,
        version="2.5",
        category="Code Specialist"
    ),
    "cretivra-omni": CretivraModel(
        id="cretivra-omni",
        display_name="Cretivra Omni 4",
        description="Multimodal frontier intelligence with live web grounding and reasoning",
        provider="ollama",
        underlying_model="gpt-4o",
        capabilities=["chat", "code", "vision", "reasoning"],
        context_length=128000,
        enabled=True,
        version="4.0",
        category="Omni Intelligence"
    ),
    "cretivra-deepseek": CretivraModel(
        id="cretivra-deepseek",
        display_name="Cretivra DeepSeek R1",
        description="Frontier open-weights deep reasoning engine with chain-of-thought tokens",
        provider="ollama",
        underlying_model="deepseek-r1:70b",
        capabilities=["chat", "reasoning", "math", "code"],
        context_length=131072,
        enabled=True,
        version="1.0",
        category="Deep Reasoning"
    ),
    "cretivra-flux": CretivraModel(
        id="cretivra-flux",
        display_name="Cretivra FLUX.1 Art",
        description="State-of-the-art high-definition visual & digital art generation",
        provider="pollinations",
        underlying_model="flux",
        capabilities=["image", "creative"],
        context_length=4096,
        enabled=True,
        version="1.0",
        category="Image Studio",
        is_available=True
    ),
    "cretivra-diffusion": CretivraModel(
        id="cretivra-diffusion",
        display_name="Cretivra SDXL Studio",
        description="Photorealistic portraits, cinematic lighting, and landscape visuals",
        provider="pollinations",
        underlying_model="flux-realism",
        capabilities=["image", "photorealistic"],
        context_length=4096,
        enabled=True,
        version="1.0",
        category="Image Studio",
        is_available=True
    ),
    "cretivra-turbo": CretivraModel(
        id="cretivra-turbo",
        display_name="Cretivra Turbo Visuals",
        description="Ultra-fast real-time instant visual synthesis engine",
        provider="pollinations",
        underlying_model="turbo",
        capabilities=["image", "fast"],
        context_length=4096,
        enabled=True,
        version="1.0",
        category="Image Studio",
        is_available=True
    ),
    "cretivra-anime": CretivraModel(
        id="cretivra-anime",
        display_name="Cretivra Anime Studio",
        description="High-definition anime, manga, and stylized digital art",
        provider="pollinations",
        underlying_model="flux-anime",
        capabilities=["image", "anime"],
        context_length=4096,
        enabled=True,
        version="1.0",
        category="Image Studio",
        is_available=True
    ),
    "cretivra-3d": CretivraModel(
        id="cretivra-3d",
        display_name="Cretivra 3D & CGI",
        description="Cinematic 3D render, Octane, and Unreal Engine CGI visuals",
        provider="pollinations",
        underlying_model="flux-3d",
        capabilities=["image", "3d"],
        context_length=4096,
        enabled=True,
        version="1.0",
        category="Image Studio",
        is_available=True
    )
}

class CretivraModelRegistry:
    def __init__(self):
        self._models: Dict[str, CretivraModel] = dict(DEFAULT_MODEL_REGISTRY)

    def get_model(self, model_id: str) -> Optional[CretivraModel]:
        return self._models.get(model_id)

    def is_image_model(self, model_id: str) -> bool:
        model = self.get_model(model_id)
        if not model:
            return False
        return "image" in model.capabilities or model.category == "Image Studio" or model.provider == "pollinations"

    def list_models(self, include_disabled: bool = False) -> List[CretivraModel]:
        models = list(self._models.values())
        if not include_disabled:
            models = [m for m in models if m.enabled]
        return models

    def register_or_update(self, model: CretivraModel):
        self._models[model.id] = model

    def resolve_underlying_model(self, model_id: str) -> str:
        model = self.get_model(model_id)
        if not model:
            # Fallback to default model if unknown ID is passed
            default_m = self.get_model("cretivra-1")
            return default_m.underlying_model if default_m else "llama3"
        return model.underlying_model

    def update_availability_from_ollama_tags(self, installed_tags: List[str], mock_mode: bool = False):
        """
        Updates the is_available flag for registered Cretivra models based on installed Ollama tags.
        Cloud/Image models remain always available.
        """
        installed_set = {tag.split(":")[0].lower() for tag in installed_tags}
        for m in self._models.values():
            if m.provider in ("pollinations", "cloud", "image") or "image" in m.capabilities:
                m.is_available = True
            elif mock_mode:
                m.is_available = True
            else:
                underlying_base = m.underlying_model.split(":")[0].lower()
                m.is_available = underlying_base in installed_set or m.underlying_model.lower() in installed_set

registry = CretivraModelRegistry()
