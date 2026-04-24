from fastapi import FastAPI
from app.database import Base, engine
from app.api import upload, extraction

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

app.include_router(upload.router)
app.include_router(extraction.router)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "CO2nvert API running"}