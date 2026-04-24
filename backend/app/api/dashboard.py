from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

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

    by_scope = {
        "scope_1": 0.0,
        "scope_2": 0.0,
        "scope_3": 0.0,
    }

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
            "processed_documents": len([
                document for document in documents
                if document.status == "processed"
            ]),
            "total_co2e_kg": round(total_co2e_kg, 2),
            "total_co2e_tonnes": round(total_co2e_kg / 1000, 4),
        },
        "by_scope_kg": {
            key: round(value, 2)
            for key, value in by_scope.items()
        },
        "by_scope_tonnes": {
            key: round(value / 1000, 4)
            for key, value in by_scope.items()
        },
        "by_activity_type_kg": {
            key: round(value, 2)
            for key, value in by_activity_type.items()
        },
        "by_activity_type_tonnes": {
            key: round(value / 1000, 4)
            for key, value in by_activity_type.items()
        },
        "documents": document_rows,
        "activities": activity_rows,
        "charts": {
            "scope_breakdown": [
            {
                "name": "Scope 1",
                "value": round(by_scope["scope_1"] / 1000, 4),
                "value_kg": round(by_scope["scope_1"], 2),
            },
            {
                "name": "Scope 2",
                "value": round(by_scope["scope_2"] / 1000, 4),
                "value_kg": round(by_scope["scope_2"], 2),
            },
            {
                "name": "Scope 3",
                "value": round(by_scope["scope_3"] / 1000, 4),
                "value_kg": round(by_scope["scope_3"], 2),
            },
            ],
            "activity_breakdown": [
                {
                    "name": activity_type,
                    "value": round(value / 1000, 4),
                    "value_kg": round(value, 2),

                }
                for activity_type, value in by_activity_type.items()
            ],
        }
    }