from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class EmissionFactor(Base):
    __tablename__ = "emission_factors"

    id = Column(Integer, primary_key=True, index=True)

    category_id = Column(Integer, ForeignKey("emission_categories.id"))

    activity_type = Column(String)
    unit = Column(String)

    factor_value = Column(Float)
    factor_unit = Column(String, default="kgCO2e/unit")

    source = Column(String, nullable=True)

    category = relationship("EmissionCategory")