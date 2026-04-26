from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Importăm routerele explicit
from app.api.upload import router as upload_router
from app.api.extraction import router as extraction_router
from app.api.batches import router as batches_router
from app.api.documents import router as documents_router
from app.api.emissions import router as emissions_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router

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

# Configurare CORS pentru React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includerea routerelor
app.include_router(upload_router)
app.include_router(extraction_router)
app.include_router(batches_router)
app.include_router(documents_router)
app.include_router(emissions_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

# Crearea tabelelor în baza de date
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "CO2nvert API running"}