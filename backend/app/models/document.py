from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))

    filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    document_type = Column(String, nullable=True)
    
    extracted_text = Column(Text, nullable=True)
    status = Column(String, default="uploaded")

    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("Batch", back_populates="documents")
    activities = relationship("Activity", back_populates="document")