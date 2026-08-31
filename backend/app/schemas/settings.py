from typing import Optional
from pydantic import BaseModel

class SystemSettingsSchema(BaseModel):
    ollama_base_url: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    max_context_messages: Optional[int] = None
    max_output_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    theme: Optional[str] = "dark"
