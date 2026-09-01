import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "CRETIVRA AI"
    API_V1_STR: str = "/api"
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    DATABASE_URL: str = Field(default="sqlite:///./cretivra.db")
    DEFAULT_MODEL: str = Field(default="cretivra-1")
    MAX_CONTEXT_MESSAGES: int = Field(default=30)
    TEMPERATURE: float = Field(default=0.7)
    MAX_OUTPUT_TOKENS: int = Field(default=4096)
    MAX_UPLOAD_SIZE_MB: int = Field(default=20)
    ENABLE_MOCK_OLLAMA: bool = Field(default=False)
    GROQ_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
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
