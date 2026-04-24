from pydantic import BaseModel
from typing import Optional


class ActivityResponse(BaseModel):
    id: int
    document_id: int
    category_id: Optional[int] = None
    activity_type: str
    scope: int
    quantity: float
    unit: str
    confidence: float

    class Config:
        from_attributes = True