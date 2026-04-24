from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    batch_id = Column(Integer, ForeignKey("batches.id"))

    report_type = Column(String, default="carbon_emissions_report")
    file_path = Column(String)

    total_scope_1 = Column(Float, default=0)
    total_scope_2 = Column(Float, default=0)
    total_scope_3 = Column(Float, default=0)
    total_co2e = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("Batch", back_populates="reports")