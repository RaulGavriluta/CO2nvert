from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(Integer, ForeignKey("documents.id"))
    category_id = Column(Integer, ForeignKey("emission_categories.id"), nullable=True)

    activity_type = Column(String)
    supplier = Column(String, nullable=True)
    period = Column(String, nullable=True)

    scope = Column(Integer)
    quantity = Column(Float)
    unit = Column(String)

    confidence = Column(Float, default=0.0)
    is_green_energy = Column(Boolean, default=False)

    document = relationship("Document", back_populates="activities")
    category = relationship("EmissionCategory", back_populates="activities")
    emission = relationship("Emission", back_populates="activity", uselist=False, cascade="all, delete-orphan")