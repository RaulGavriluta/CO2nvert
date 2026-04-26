from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="CO2nvert Report Batch")
    company_name = Column(String, default="Demo Company")
    reporting_period = Column(String, default="2025")
    status = Column(String, default="created")
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="batch")
    reports = relationship("Report", back_populates="batch")