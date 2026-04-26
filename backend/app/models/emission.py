from sqlalchemy import Column, Integer, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base


class Emission(Base):
    __tablename__ = "emissions"

    id = Column(Integer, primary_key=True, index=True)

    activity_id = Column(Integer, ForeignKey("activities.id"))

    co2e_value = Column(Float)
    co2e_unit = Column(String, default="kgCO2e")

    emission_factor = Column(Float)
    emission_factor_unit = Column(String)

    calculation_method = Column(String)
    formula = Column(String)

    activity = relationship("Activity", back_populates="emission")