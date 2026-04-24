from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class EmissionCategory(Base):
    __tablename__ = "emission_categories"

    id = Column(Integer, primary_key=True, index=True)

    scope = Column(Integer, nullable=False)

    code = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)

    example_documents = Column(Text, nullable=True)

    activities = relationship("Activity", back_populates="category")