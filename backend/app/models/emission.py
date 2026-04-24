from sqlalchemy import Column, Integer, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base


class Emission(Base):
    __tablename__ = "emissions"

    id = Column(Integer, primary_key=True, index=True)

    activity_id = Column(Integer, ForeignKey("activities.id"))

    emission_factor = Column(Float)
    co2e_value = Column(Float)

    calculation_method = Column(String, default="quantity * emission_factor")
    formula = Column(String, nullable=True)

    activity = relationship("Activity", back_populates="emission")