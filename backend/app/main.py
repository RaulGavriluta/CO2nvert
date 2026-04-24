from fastapi import FastAPI
from app.database import Base, engine
from app.api import upload, extraction, batches, documents, emissions, dashboard, reports
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
app.include_router(batches.router)
app.include_router(documents.router)
app.include_router(emissions.router)
app.include_router(dashboard.router)
app.include_router(reports.router)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "CO2nvert API running"}