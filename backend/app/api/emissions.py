from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Batch, Document, Activity, Emission
from app.services.carbon_calculator import calculate_emission

router = APIRouter(prefix="/emissions", tags=["Emissions"])


@router.post("/calculate/{batch_id}")
def calculate_batch_emissions(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    activities = (
        db.query(Activity)
        .join(Document, Activity.document_id == Document.id)
        .filter(Document.batch_id == batch_id)
        .all()
    )

    if not activities:
        raise HTTPException(status_code=404, detail="No activities found for this batch")

    total_co2e = 0.0

    by_scope = {
        "scope_1": 0.0,
        "scope_2": 0.0,
        "scope_3": 0.0,
    }

    results = []

    for activity in activities:
        existing_emission = (
            db.query(Emission)
            .filter(Emission.activity_id == activity.id)
            .first()
        )

        if existing_emission:
            db.delete(existing_emission)
            db.commit()

        co2e, factor, factor_unit, formula = calculate_emission(
            activity_type=activity.activity_type,
            quantity=activity.quantity,
            unit=activity.unit,
            is_green_energy=activity.is_green_energy
        )

        emission = Emission(
            activity_id=activity.id,
            co2e_value=co2e,
            co2e_unit="kgCO2e",
            emission_factor=factor,
            emission_factor_unit=factor_unit,
            calculation_method="activity_data * emission_factor",
            formula=formula,
        )

        db.add(emission)

        total_co2e += co2e

        scope_key = f"scope_{activity.scope}"
        if scope_key in by_scope:
            by_scope[scope_key] += co2e

        results.append({
            "activity_id": activity.id,
            "activity_type": activity.activity_type,
            "scope": activity.scope,
            "quantity": activity.quantity,
            "unit": activity.unit,
            "co2e_kg": round(co2e, 2),
            "co2e_tonnes": round(co2e / 1000, 4),
            "emission_factor": factor,
            "factor_unit": factor_unit,
            "formula": formula,
        })

    db.commit()

    return {
        "message": "Emissions calculated successfully",
        "batch_id": batch_id,
        "total_co2e_kg": round(total_co2e, 2),
        "total_co2e_tonnes": round(total_co2e / 1000, 4),
        "by_scope_kg": {
            key: round(value, 2)
            for key, value in by_scope.items()
        },
        "by_scope_tonnes": {
            key: round(value / 1000, 4)
            for key, value in by_scope.items()
        },
        "results": results,
    }