from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importăm toate routerele din folderul api
from app.api import reports, upload, extraction, emissions

app = FastAPI(title="CO2nvert API")

# Configurare CORS - am adăugat și portul 5173 și fallback-ul de IP
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONECTAREA RUTERELOR (Ordinea contează) ---

# 1. Permitem încărcarea fișierelor
app.include_router(upload.router)

# 2. Permitem procesarea OCR/AI
app.include_router(extraction.router)

# 3. Permitem calculul matematic al emisiilor
app.include_router(emissions.router)

# 4. Permitem generarea PDF-ului final
app.include_router(reports.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "CO2nvert API is running with all modules connected",
        "available_endpoints": ["/upload", "/extract", "/emissions", "/reports"]
    }