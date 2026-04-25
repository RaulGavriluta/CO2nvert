from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.activity import Activity
from app.models.emission import Emission

# Definim router-ul (prefixul îl va pune automat la fiecare rută de aici)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/emissions/summary")
def get_emissions_summary(year: str, db: Session = Depends(get_db)):
    """
    Extrage totalul de emisii grupate pe Scope pentru un anumit an/perioadă.
    Atenție: Folosim `year: str` pentru că în baza de date `period` este String.
    """
    
    results = (
        db.query(
            Activity.scope,
            func.sum(Emission.co2e_value).label("total_kg")
        )
        .join(Emission, Activity.id == Emission.activity_id)
        .filter(Activity.period == year) # Filtrăm după coloana period
        .group_by(Activity.scope)
        .all()
    )

    formatted_data = []
    
    for row in results:
        # Dacă nu există date, funcția sum poate returna None. Punem 0 ca default.
        kg_total = row.total_kg or 0 
        
        # Formatăm frumos numele pentru React în funcție de numărul Scope-ului (1, 2 sau 3)
        scope_name = f"Scope {row.scope}"
        if row.scope == 1:
            scope_name += " (Emisii Directe)"
        elif row.scope == 2:
            scope_name += " (Energie)"
        elif row.scope == 3:
            scope_name += " (Lanț Valoric)"

        formatted_data.append({
            "name": scope_name,
            "value": round(kg_total / 1000, 2) # Convertim din KG în TONE de CO2
        })

    return formatted_data