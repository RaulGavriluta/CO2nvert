from fastapi import FastAPI
from app.database import Base, engine

from app.models import (
    Batch,
    Document,
    EmissionCategory,
    Activity,
    EmissionFactor,
    Emission,
    Report,
)

app = FastAPI(
    title="CO2nvert API",
    description="AI-powered carbon reporting API",
    version="0.1.0"
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "CO2nvert API running"}