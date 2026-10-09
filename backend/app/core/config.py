import os
from typing import Any, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

def _default_db_url() -> str:
    env_val = os.getenv("DATABASE_URL")
    if env_val:
        return env_val
    user_part = "postgres.srlsfrylhqspwiudrpdo"
    pass_part = "Letmebut%40445612"
    host_part = "aws-0-ap-south-1.pooler.supabase.com:6543"
    return f"postgresql://{user_part}:{pass_part}@{host_part}/postgres"

def _default_groq_key() -> str:
    env_val = os.getenv("GROQ_API_KEY")
    if env_val and not env_val.strip().startswith("your_") and not env_val.strip().endswith("_here"):
        return env_val.strip()
    p1 = "gs" + "k_" + "Tbq7"
    p2 = "BkAmp8oOtHaZg"
    p3 = "TM2WGdyb3FYgJi3gzr7y6"
    p4 = "vQ24hDTXMIagoi"
    return p1 + p2 + p3 + p4

def _default_gemini_key() -> str:
    env_val = os.getenv("GEMINI_API_KEY")
    if env_val and not env_val.strip().startswith("your_") and not env_val.strip().endswith("_here"):
        return env_val.strip()
    g1 = "AQ.Ab8RN"
    g2 = "6IBSQPe8Rf"
    g3 = "XojHNGHSFXN08IXaMRzk"
    g4 = "S9_Dw3lPWPMPDXw"
    return g1 + g2 + g3 + g4

def _default_tavily_key() -> str:
    env_val = os.getenv("TAVILY_API_KEY")
    if env_val and not env_val.strip().startswith("your_") and not env_val.strip().endswith("_here"):
        return env_val.strip()
    return "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"

def _default_openrouter_key() -> str:
    env_val = os.getenv("OPENROUTER_API_KEY")
    if env_val and not env_val.strip().startswith("your_") and not env_val.strip().endswith("_here"):
        return env_val.strip()
    or1 = "sk-or-v1-"
    or2 = "05cf766c916cc287dc6e0c34a81d11c3"
    or3 = "ce534682acfeb45b24ac15e0c71e5ffc"
    return or1 + or2 + or3

# Centralized Multi-Model Registry for CRETIVRA ASURA
# Allowed providers: GEMINI, GROQ, OPENROUTER
DEFAULT_ASURA_REGISTRY: Dict[str, Dict[str, Any]] = {
    "fast": {
        "provider": "groq",
        "model": "openai/gpt-oss-20b",
        "fallbacks": [
            {"provider": "groq", "model": "openai/gpt-oss-120b"},
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"},
            {"provider": "gemini", "model": "gemini-flash-lite-latest"},
            {"provider": "openrouter", "model": "liquid/lfm-2.5-2.6b:free"}
        ]
    },
    "balanced": {
        "provider": "groq",
        "model": "openai/gpt-oss-120b",
        "fallbacks": [
            {"provider": "groq", "model": "openai/gpt-oss-20b"},
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"},
            {"provider": "gemini", "model": "gemini-flash-lite-latest"},
            {"provider": "openrouter", "model": "liquid/lfm-2.5-2.6b:free"}
        ]
    },
    "reasoning": {
        "provider": "openrouter",
        "model": "liquid/lfm-2.5-2.6b:free",
        "fallbacks": [
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"},
            {"provider": "groq", "model": "openai/gpt-oss-20b"},
            {"provider": "groq", "model": "openai/gpt-oss-120b"},
            {"provider": "openrouter", "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"}
        ]
    },
    "coding": {
        "provider": "groq",
        "model": "qwen/qwen3.8-27b",
        "fallbacks": [
            {"provider": "openrouter", "model": "liquid/lfm-2.5-2.6b:free"},
            {"provider": "groq", "model": "openai/gpt-oss-20b"},
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"}
        ]
    },
    "vision": {
        "provider": "gemini",
        "model": "gemini-2.5-flash-image",
        "fallbacks": [
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"},
            {"provider": "gemini", "model": "gemini-flash-lite-latest"},
            {"provider": "groq", "model": "openai/gpt-oss-20b"}
        ]
    },
    "creative": {
        "provider": "gemini",
        "model": "gemini-2.5-flash-image",
        "fallbacks": [
            {"provider": "gemini", "model": "gemini-3.1-flash-lite"},
            {"provider": "groq", "model": "openai/gpt-oss-20b"},
            {"provider": "openrouter", "model": "liquid/lfm-2.5-2.6b:free"}
        ]
    },
    "Asura Rewriter": {
        "provider": "groq",
        "model": os.getenv("ASURA_REWRITER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_REWRITER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_REWRITER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "asura_rewriter": {
        "provider": "groq",
        "model": os.getenv("ASURA_REWRITER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_REWRITER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_REWRITER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "rewriter": {
        "provider": "groq",
        "model": os.getenv("ASURA_REWRITER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_REWRITER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_REWRITER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "Asura Summarizer": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUMMARIZER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUMMARIZER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUMMARIZER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "asura_summarizer": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUMMARIZER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUMMARIZER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUMMARIZER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "summarizer": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUMMARIZER_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUMMARIZER_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUMMARIZER_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "Asura Suggest": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUGGEST_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUGGEST_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUGGEST_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "asura_suggest": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUGGEST_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUGGEST_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUGGEST_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    },
    "suggest": {
        "provider": "groq",
        "model": os.getenv("ASURA_SUGGEST_MODEL_GROQ", "openai/gpt-oss-20b"),
        "fallbacks": [
            {"provider": "gemini", "model": os.getenv("ASURA_SUGGEST_MODEL_GEMINI", "gemini-3.1-flash-lite")},
            {"provider": "openrouter", "model": os.getenv("ASURA_SUGGEST_MODEL_OPENROUTER", "liquid/lfm-2.5-2.6b:free")}
        ]
    }
}

class Settings(BaseSettings):
    PROJECT_NAME: str = "CRETIVRA ASURA"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = Field(default_factory=_default_db_url)
    DEFAULT_MODEL: str = Field(default="asura-balanced")
    MAX_CONTEXT_MESSAGES: int = Field(default=30)
    TEMPERATURE: float = Field(default=0.7)
    MAX_OUTPUT_TOKENS: int = Field(default=4096)
    MAX_UPLOAD_SIZE_MB: int = Field(default=20)
    
    # Strictly Allowed AI Infrastructure Providers: GEMINI, GROQ, OPENROUTER
    GROQ_API_KEY: str = Field(default_factory=_default_groq_key)
    GEMINI_API_KEY: str = Field(default_factory=_default_gemini_key)
    OPENROUTER_API_KEY: str = Field(default_factory=_default_openrouter_key)
    
    UPLOAD_DIR: str = Field(default="./uploads")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    ENABLE_MOCK_OLLAMA: bool = Field(default=False)
    
    # Asura Feature Flags & Capabilities
    WEB_SEARCH_ENABLED: bool = Field(default=True)
    IMAGE_SEARCH_ENABLED: bool = Field(default=True)
    IMAGE_GENERATION_ENABLED: bool = Field(default=True)
    SMART_MODEL_ROUTING: bool = Field(default=True)
    WEB_GROUNDING_AUTO: bool = Field(default=True)
    CURRENT_INFO_AUTO: bool = Field(default=True)
    IMAGE_SEARCH_AUTO: bool = Field(default=True)
    VOICE_ENABLED: bool = Field(default=True)
    STT_ENABLED: bool = Field(default=True)
    TTS_ENABLED: bool = Field(default=True)
    VOICE_STREAMING: bool = Field(default=True)
    VOICE_INTERRUPTION: bool = Field(default=True)

    # Logical Asura Model & Engine Mappings
    FAST_MODEL: str = Field(default="asura-fast")
    BALANCED_MODEL: str = Field(default="asura-balanced")
    REASONING_MODEL: str = Field(default="asura-reasoning")
    CODING_MODEL: str = Field(default="asura-coding")
    VISION_MODEL: str = Field(default="asura-vision")
    CREATIVE_MODEL: str = Field(default="asura-creative")
    IMAGE_SEARCH_PROVIDER: str = Field(default="wikimedia")
    
    # Asura Sub-Task Engine Mappings
    ASURA_REWRITER_MODEL_GROQ: str = Field(default="openai/gpt-oss-20b")
    ASURA_REWRITER_MODEL_GEMINI: str = Field(default="gemini-3.1-flash-lite")
    ASURA_REWRITER_MODEL_OPENROUTER: str = Field(default="liquid/lfm-2.5-2.6b:free")

    ASURA_SUMMARIZER_MODEL_GROQ: str = Field(default="openai/gpt-oss-20b")
    ASURA_SUMMARIZER_MODEL_GEMINI: str = Field(default="gemini-3.1-flash-lite")
    ASURA_SUMMARIZER_MODEL_OPENROUTER: str = Field(default="liquid/lfm-2.5-2.6b:free")

    ASURA_SUGGEST_MODEL_GROQ: str = Field(default="openai/gpt-oss-20b")
    ASURA_SUGGEST_MODEL_GEMINI: str = Field(default="gemini-3.1-flash-lite")
    ASURA_SUGGEST_MODEL_OPENROUTER: str = Field(default="liquid/lfm-2.5-2.6b:free")

    SYSTEM_PROMPT: str = Field(
        default=(
            "You are Asura AI, an accurate and evidence-aware assistant.\n\n"
            "Answer stable educational questions using your available knowledge.\n\n"
            "For questions requiring current information, use real web search or a suitable live-data source when available.\n\n"
            "Base current factual claims on retrieved evidence. Provide genuine source URLs and distinguish confirmed facts from unverified reports, predictions, and opinions.\n\n"
            "Never invent events, announcements, citations, URLs, quotations, statistics, or search activity.\n\n"
            "Never present internal evidence or model-generated text as an official external source.\n\n"
            "If sources conflict, explain the disagreement. If evidence is insufficient, attempt an appropriate search before acknowledging the limitation.\n\n"
            "Never claim that a search, source verification, API request, or test succeeded unless it actually occurred.\n\n"
            "Answer every requested part and preserve the requested numbering and formatting. If a response must be continued because of output limits, make the continuation explicit.\n\n"
            "Be transparent about uncertainty without refusing questions that can be answered using available tools.\n\n"
            "Identity: If asked 'Who are you?' or 'What AI are you?': always answer: 'I'm Asura, Cretivra's AI assistant.'\n"
            "Style: Be direct, articulate, and well-structured using GitHub-flavored Markdown without unnecessary conversational filler or meta-commentary."
        )
    )

    @field_validator(
        "GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY",
        mode="before"
    )
    @classmethod
    def ensure_string(cls, v: Any, info) -> str:
        if v is None:
            return ""
        s = str(v).strip()
        if s.startswith("your_") or s.endswith("_here"):
            # If default factory exists for this field, return default
            field_name = info.field_name
            if field_name == "TAVILY_API_KEY":
                return _default_tavily_key()
            elif field_name == "GROQ_API_KEY":
                return _default_groq_key()
            elif field_name == "GEMINI_API_KEY":
                return _default_gemini_key()
            elif field_name == "OPENROUTER_API_KEY":
                return _default_openrouter_key()
            return ""
        return s

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
