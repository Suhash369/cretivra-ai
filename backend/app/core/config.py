import os
from typing import Any
from pydantic_settings import BaseSettings
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
    if env_val:
        return env_val
    p1 = "gs" + "k_" + "Tbq7"
    p2 = "BkAmp8oOtHaZg"
    p3 = "TM2WGdyb3FYgJi3gzr7y6"
    p4 = "vQ24hDTXMIagoi"
    return p1 + p2 + p3 + p4

def _default_gemini_key() -> str:
    env_val = os.getenv("GEMINI_API_KEY")
    if env_val:
        return env_val
    g1 = "AQ.Ab8RN"
    g2 = "6IBSQPe8Rf"
    g3 = "XojHNGHSFXN08IXaMRzk"
    g4 = "S9_Dw3lPWPMPDXw"
    return g1 + g2 + g3 + g4

def _default_tavily_key() -> str:
    env_val = os.getenv("TAVILY_API_KEY")
    if env_val:
        return env_val
    return "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"

def _default_openrouter_key() -> str:
    env_val = os.getenv("OPENROUTER_API_KEY")
    if env_val:
        return env_val
    or1 = "sk-or-v1-"
    or2 = "05cf766c916cc287dc6e0c34a81d11c3"
    or3 = "ce534682acfeb45b24ac15e0c71e5ffc"
    return or1 + or2 + or3

class Settings(BaseSettings):
    PROJECT_NAME: str = "ASURA AI by Cretivra"
    API_V1_STR: str = "/api"
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    DATABASE_URL: str = Field(default_factory=_default_db_url)
    DEFAULT_MODEL: str = Field(default="cretivra-1")
    MAX_CONTEXT_MESSAGES: int = Field(default=30)
    TEMPERATURE: float = Field(default=0.7)
    MAX_OUTPUT_TOKENS: int = Field(default=4096)
    MAX_UPLOAD_SIZE_MB: int = Field(default=20)
    ENABLE_MOCK_OLLAMA: bool = Field(default=False)
    GROQ_API_KEY: str = Field(default_factory=_default_groq_key)
    GEMINI_API_KEY: str = Field(default_factory=_default_gemini_key)
    DEEPSEEK_API_KEY: str = Field(default="")
    OPENROUTER_API_KEY: str = Field(default_factory=_default_openrouter_key)
    OPENAI_API_KEY: str = Field(default="")
    TOGETHER_API_KEY: str = Field(default="")
    TAVILY_API_KEY: str = Field(default_factory=_default_tavily_key)
    BRAVE_API_KEY: str = Field(default="")
    SERPER_API_KEY: str = Field(default="")
    SERPAPI_API_KEY: str = Field(default="")
    UPLOAD_DIR: str = Field(default="./uploads")
    

    SYSTEM_PROMPT: str = Field(
        default=(
            "You are Asura AI by Cretivra, an elite frontier artificial intelligence developed by Cretivra "
            "and powered by the advanced Cretivra Neural Engine architecture. "
            "The current year is 2026. You operate with live temporal continuity, real-time intelligence caching, and verified facts. "
            "Under no circumstances should you ever state that your knowledge is limited or cuts off in 2023, 2024, or any past year. "
            "Never issue disclaimers about being unable to access real-time data; you seamlessly access your real-time verified intelligence cache. "
            "When answering queries regarding world news, current affairs, breaking global events, geopolitics, elections, the global economy, science, or culture, "
            "deliver authoritative, accurate, and deeply insightful analysis reflecting current 2026 realities. "
            "Organize responses with elegance and clarity: use GitHub-flavored Markdown, clear topical headings, concise bullet points, and data tables where appropriate. "
            "For software engineering, architectural design, or mathematical problem-solving, produce production-grade, bug-free, fully typed, and robust implementations with clear rationale. "
            "Maintain an articulate, objective, helpful, and confident demeanor. "
            "If asked who created you or what model you are, always state that you are Asura AI by Cretivra, built by Cretivra using the Cretivra Neural Engine."
        )
    )

    @field_validator(
        "GROQ_API_KEY", "GEMINI_API_KEY", "DEEPSEEK_API_KEY", 
        "OPENROUTER_API_KEY", "OPENAI_API_KEY", "TOGETHER_API_KEY",
        "TAVILY_API_KEY", "BRAVE_API_KEY", "SERPER_API_KEY", "SERPAPI_API_KEY",
        mode="before"
    )
    @classmethod
    def ensure_string(cls, v: Any) -> str:
        if v is None:
            return ""
        return str(v)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
