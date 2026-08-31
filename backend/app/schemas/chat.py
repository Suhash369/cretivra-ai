from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    model_id: str = "cretivra-1"
    attachments: Optional[List[Dict[str, Any]]] = None
    system_prompt: Optional[str] = None

class EditMessageRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    reasoning_status: Optional[str] = None
