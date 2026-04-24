from pydantic import BaseModel
from typing import Optional, List

from app.schemas.activity_schema import ActivityResponse


class DocumentResponse(BaseModel):
    id: int
    batch_id: int
    filename: str
    file_path: str
    file_type: str
    document_type: Optional[str] = None
    status: str
    activities: List[ActivityResponse] = []

    class Config:
        from_attributes = True