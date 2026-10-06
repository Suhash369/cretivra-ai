from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AsuraImage(BaseModel):
    url: str
    thumbnail: Optional[str] = None
    title: Optional[str] = None
    source_url: Optional[str] = None
    source_domain: Optional[str] = None
    attribution: Optional[str] = None

class AsuraSource(BaseModel):
    title: str
    url: str
    domain: str
    snippet: Optional[str] = None

class AsuraGeneratedImage(BaseModel):
    url: str
    thumbnail: Optional[str] = None
    prompt: str
    attribution: str = "Asura generated this image"

class AsuraStructuredResponse(BaseModel):
    assistant: str = "asura"
    brand: str = "Cretivra Asura"
    answer: str
    type: str = "text"
    web_grounded: bool = False
    current_information: bool = False
    images: List[AsuraImage] = Field(default_factory=list)
    sources: List[AsuraSource] = Field(default_factory=list)
    generated_image: Optional[AsuraGeneratedImage] = None
    related_questions: List[str] = Field(default_factory=list)
    voice_available: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)
