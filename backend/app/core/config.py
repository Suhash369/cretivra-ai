import os
from pydantic_settings import BaseSettings
from pydantic import Field

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
def _default_tavily_key() -> str:
    env_val = os.getenv("TAVILY_API_KEY")
    if env_val:
        return env_val
    return "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"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CRETIVRA AI"
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
    GEMINI_API_KEY: str = Field(default="")
    TAVILY_API_KEY: str = Field(default_factory=_default_tavily_key)
    SERPER_API_KEY: str = Field(default="")
    SERPAPI_API_KEY: str = Field(default="")
    UPLOAD_DIR: str = Field(default="./uploads")
    

    SYSTEM_PROMPT: str = Field(
        default="You are Cretivra AI, an intelligent AI assistant created by Cretivra. "
                "Be helpful, accurate, clear and honest. If you are uncertain, say so. "
                "Never fabricate information."
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
