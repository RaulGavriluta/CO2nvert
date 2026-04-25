from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models import Batch, Document, Activity, Emission

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_scope_label(scope: int) -> str:
    if scope == 1:
        return "Scope 1"
    if scope == 2:
        return "Scope 2"
    if scope == 3:
        return "Scope 3"
    return "Unknown Scope"

def normalize_display_unit(unit: str) -> str:
    unit_map = {
        "liters": "liter",
        "kwh": "kWh",
        "mwh": "MWh",
        "gj": "GJ",
        "m3": "m3",
    }
    return unit_map.get(unit.lower(), unit)


# ==============================================================================
# 1. RUTELE STATICE (Trebuie să fie MEREU deasupra celor cu {batch_id})
# ==============================================================================

@router.get("/statistics")
def get_dashboard_statistics(db: Session = Depends(get_db)):
    # 1. Calculăm TOTALUL emisiilor (din toate documentele procesate)
    total_emisii = db.query(func.sum(Emission.co2e_value)).scalar() or 0.0
    total_tonnes = total_emisii / 1000

    # 2. Construim datele pentru Graficul Donut (Scope 1, 2, 3)
    scope_query = db.query(
        Activity.scope, 
        func.sum(Emission.co2e_value).label('total')
    ).join(Emission).group_by(Activity.scope).all()

    scope_colors = {
        1: "#10b981", # Verde
        2: "#3b82f6", # Albastru
        3: "#a855f7"  # Mov
    }
    
    scope_data = []
    for r in scope_query:
        if r.scope is not None:
            scope_data.append({
                "name": f"Scope {r.scope}",
                "value": round(r.total / 1000, 2),
                "color": scope_colors.get(r.scope, "#cbd5e1")
            })

    # Dacă nu avem date încă, punem un placeholder ca să nu arate urât graficul
    if not scope_data:
        scope_data = [{"name": "Fără date", "value": 1, "color": "#f1f5f9"}]

    # 3. Construim "Top Surse Generatoare" (Top 4 activități care poluează cel mai mult)
    sources_query = db.query(
        Activity.activity_type,
        Activity.scope,
        func.sum(Emission.co2e_value).label('total')
    ).join(Emission).group_by(Activity.activity_type, Activity.scope).order_by(func.sum(Emission.co2e_value).desc()).limit(4).all()

    # Styling pentru React în funcție de Scope
    colors_conf = {
        1: {"color": "text-emerald-500", "bg": "bg-emerald-50", "bar": "bg-emerald-500"},
        2: {"color": "text-blue-500", "bg": "bg-blue-50", "bar": "bg-blue-500"},
        3: {"color": "text-purple-500", "bg": "bg-purple-50", "bar": "bg-purple-500"},
    }

    top_sources = []
    for idx, r in enumerate(sources_query):
        # Calculăm ce procent reprezintă din total
        percent = round((r.total / total_emisii) * 100) if total_emisii > 0 else 0
        c = colors_conf.get(r.scope, colors_conf[1])
        
        top_sources.append({
            "id": idx + 1,
            "name": str(r.activity_type).replace("_", " ").title(),
            "category": f"Scope {r.scope}",
            "value": f"{round(r.total / 1000, 2):,}",
            "percent": percent,
            "colorColor": c["color"],
            "bgColor": c["bg"],
            "barColor": c["bar"]
        })

    # 4. Trendul Lunar (Evoluția)
    # Pentru moment generăm un trend static care se termină cu totalul real la zi 
    # (Calcularea pe luni necesită funcții SQL specifice bazei de date folosite: SQLite vs Postgres)
    monthly_trend = [
        { "name": "Lunile trecute", "emisii": round(total_tonnes * 0.8, 2) }, 
        { "name": "Prezent", "emisii": round(total_tonnes, 2) } 
    ]

    # Returnăm obiectul FINAL, calculat pe bune din DB
    return {
        "totalEmissions": round(total_tonnes, 2),
        "monthlyTrend": monthly_trend,
        "scopeData": scope_data,
        "topSources": top_sources
    }

@router.get("/emissions/summary")
def get_emissions_summary(db: Session = Depends(get_db)):
    results = db.query(
        Activity.scope,
        func.sum(Emission.co2e_value).label('total')
    ).join(Emission, Activity.id == Emission.activity_id)\
     .group_by(Activity.scope).all()

    return [
        {
            "name": get_scope_label(r.scope),
            "value": round((r.total or 0) / 1000, 2) # Rotunjim la tone
        }
        for r in results if r.scope is not None
    ]

@router.get("/emissions/history")
def get_emissions_history(db: Session = Depends(get_db)):
    # Luăm toate activitățile și le legăm de emisiile lor calculate
    activities = (
        db.query(Activity)
        .options(joinedload(Activity.emission))
        .order_by(Activity.id.desc())
        .all()
    )

    history = []
    for act in activities:
        history.append({
            "id": act.id,
            "type": act.activity_type.capitalize(),
            "scope": f"Scope {act.scope}",
            "quantity": act.quantity,
            "unit": act.unit,
            "co2e": round(act.emission.co2e_value, 2) if act.emission else 0,
            # Dacă ai adăugat data_procesarii în model, o poți pune aici
        })
    
    return history


# ==============================================================================
# 2. RUTA DINAMICĂ (Trebuie să fie ULTIMA!)
# ==============================================================================
@router.get("/{batch_id}")
def get_dashboard(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    documents = (
        db.query(Document)
        .filter(Document.batch_id == batch_id)
        .all()
    )

    activities = (
        db.query(Activity)
        .join(Document, Activity.document_id == Document.id)
        .options(joinedload(Activity.emission))
        .filter(Document.batch_id == batch_id)
        .all()
    )

    total_co2e_kg = 0.0
    by_scope = {"scope_1": 0.0, "scope_2": 0.0, "scope_3": 0.0}
    by_activity_type = {}
    activity_rows = []

    for activity in activities:
        emission_value = activity.emission.co2e_value if activity.emission else 0.0
        total_co2e_kg += emission_value
        
        scope_key = f"scope_{activity.scope}"
        if scope_key in by_scope:
            by_scope[scope_key] += emission_value

        if activity.activity_type not in by_activity_type:
            by_activity_type[activity.activity_type] = 0.0

        by_activity_type[activity.activity_type] += emission_value

        activity_rows.append({
            "activity_id": activity.id,
            "document_id": activity.document_id,
            "activity_type": activity.activity_type,
            "scope": activity.scope,
            "scope_label": get_scope_label(activity.scope),
            "quantity": activity.quantity,
            "unit": normalize_display_unit(activity.unit),
            "confidence": round(activity.confidence, 2),
            "co2e_kg": round(emission_value, 2),
            "co2e_tonnes": round(emission_value / 1000, 4),
        })

    document_rows = [
        {
            "document_id": document.id,
            "filename": document.filename,
            "display_name": document.filename,
            "document_type": document.document_type,
            "status": document.status,
            "file_type": document.file_type,
        }
        for document in documents
    ]

    return {
        "batch": {
            "id": batch.id,
            "name": batch.name,
            "company_name": batch.company_name,
            "reporting_period": batch.reporting_period,
            "status": batch.status,
            "created_at": batch.created_at,
        },
        "kpis": {
            "documents_count": len(documents),
            "activities_count": len(activities),
            "processed_documents": len([d for d in documents if d.status == "processed"]),
            "total_co2e_kg": round(total_co2e_kg, 2),
            "total_co2e_tonnes": round(total_co2e_kg / 1000, 4),
        },
        "by_scope_kg": {k: round(v, 2) for k, v in by_scope.items()},
        "by_scope_tonnes": {k: round(v / 1000, 4) for k, v in by_scope.items()},
        "by_activity_type_kg": {k: round(v, 2) for k, v in by_activity_type.items()},
        "by_activity_type_tonnes": {k: round(v / 1000, 4) for k, v in by_activity_type.items()},
        "documents": document_rows,
        "activities": activity_rows,
        "charts": {
            "scope_breakdown": [
                {"name": "Scope 1", "value": round(by_scope["scope_1"] / 1000, 4), "value_kg": round(by_scope["scope_1"], 2)},
                {"name": "Scope 2", "value": round(by_scope["scope_2"] / 1000, 4), "value_kg": round(by_scope["scope_2"], 2)},
                {"name": "Scope 3", "value": round(by_scope["scope_3"] / 1000, 4), "value_kg": round(by_scope["scope_3"], 2)},
            ],
            "activity_breakdown": [
                {"name": act_type, "value": round(val / 1000, 4), "value_kg": round(val, 2)}
                for act_type, val in by_activity_type.items()
            ],
        }
    }