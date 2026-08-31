from typing import Optional, List
from pydantic import BaseModel

class ModelUpdateSchema(BaseModel):
    model_id: str
    underlying_model: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
