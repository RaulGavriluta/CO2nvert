@echo off
title CO2nvert Runner

echo ==========================================
echo   PORNIRE SISTEM CO2NVERT
echo ==========================================

:: 1. Pornire Backend
:: Folosim .venv si intram in backend
echo [+] Pornim Backend-ul (FastAPI)...
start "Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload"

:: 2. Pornire Frontend
:: Atentie: intram in frontend/CO2nvert pentru a gasi package.json
echo [+] Pornim Frontend-ul (React)...
start "Frontend" cmd /k "cd frontend\CO2nvert && npm run dev"

echo ==========================================
echo   GATA! Aplicatia ruleaza.
echo ==========================================
pause