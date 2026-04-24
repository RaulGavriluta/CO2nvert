from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.schemas.document_schema import DocumentResponse


class BatchResponse(BaseModel):
    id: int
    name: str
    company_name: str
    reporting_period: str
    status: str
    created_at: datetime
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True