from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model_id: str = "cretivra-1"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model_id: Optional[str] = None

class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    reasoning_status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConversationSchema(BaseModel):
    id: str
    title: str
    model_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    messages: List[MessageSchema] = []

    class Config:
        from_attributes = True
