from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Batch, Document, Activity, Report
from app.services.report_generator import generate_report_pdf


router = APIRouter(prefix="/reports", tags=["Reports"])


def percent(value: float, total: float) -> float:
    if total == 0:
        return 0.0

    return round((value / total) * 100, 2)


def build_bar_items(values: dict) -> list[dict]:
    max_value = max(values.values()) if values else 1

    if max_value == 0:
        max_value = 1

    return [
        {
            "name": name,
            "value": round(value / 1000, 4),
            "percent": round((value / max_value) * 100, 2),
        }
        for name, value in values.items()
    ]


@router.post("/generate/{batch_id}")
def generate_report(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    documents = db.query(Document).filter(Document.batch_id == batch_id).all()

    activities = (
        db.query(Activity)
        .join(Document, Activity.document_id == Document.id)
        .options(joinedload(Activity.emission))
        .filter(Document.batch_id == batch_id)
        .all()
    )

    if not activities:
        raise HTTPException(
            status_code=400,
            detail="No extracted activities found. Run extraction first."
        )

    for activity in activities:
        if not activity.emission:
            raise HTTPException(
                status_code=400,
                detail="Some activities have no emissions calculated. Run emissions calculation first."
            )

    total_scope_1 = 0.0
    total_scope_2 = 0.0
    total_scope_3 = 0.0
    total_co2e = 0.0

    activity_rows = []
    factor_rows = []
    activity_breakdown = {}

    for activity in activities:
        emission = activity.emission
        co2e = emission.co2e_value

        total_co2e += co2e

        if activity.scope == 1:
            total_scope_1 += co2e
        elif activity.scope == 2:
            total_scope_2 += co2e
        elif activity.scope == 3:
            total_scope_3 += co2e

        activity_breakdown[activity.activity_type] = (
            activity_breakdown.get(activity.activity_type, 0.0) + co2e
        )

        activity_rows.append({
            "activity_type": activity.activity_type,
            "scope": activity.scope,
            "quantity": activity.quantity,
            "unit": activity.unit,
            "confidence": round(activity.confidence, 2),
            "co2e_kg": round(co2e, 2),
            "co2e_tonnes": round(co2e / 1000, 4),
        })

        factor_rows.append({
            "activity_type": activity.activity_type,
            "emission_factor": emission.emission_factor,
            "emission_factor_unit": emission.emission_factor_unit,
            "formula": emission.formula,
        })

    by_scope_for_ai = {
        "scope_1": total_scope_1,
        "scope_2": total_scope_2,
        "scope_3": total_scope_3,
    }

    total_tonnes = round(total_co2e / 1000, 4)

    chart_scope_items = build_bar_items({
        "Scope 1": total_scope_1,
        "Scope 2": total_scope_2,
        "Scope 3": total_scope_3,
    })

    chart_activity_items = build_bar_items(activity_breakdown)

    context = {
        "company_name": batch.company_name,
        "reporting_period": batch.reporting_period,
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),

        "documents_count": len(documents),
        "activities_count": len(activities),

        "total_co2e_kg": round(total_co2e, 2),
        "total_co2e_tonnes": total_tonnes,

        "by_scope": {
            "scope_1_kg": round(total_scope_1, 2),
            "scope_1_tonnes": round(total_scope_1 / 1000, 4),
            "scope_1_percent": percent(total_scope_1, total_co2e),

            "scope_2_kg": round(total_scope_2, 2),
            "scope_2_tonnes": round(total_scope_2 / 1000, 4),
            "scope_2_percent": percent(total_scope_2, total_co2e),

            "scope_3_kg": round(total_scope_3, 2),
            "scope_3_tonnes": round(total_scope_3 / 1000, 4),
            "scope_3_percent": percent(total_scope_3, total_co2e),
        },

        "activities": activity_rows,
        "emission_factors": factor_rows,

        "chart_scope_items": chart_scope_items,
        "chart_activity_items": chart_activity_items,

        "ai_summary": "",
"limitations": [
    "Raportul depinde de calitatea documentelor încărcate și de acuratețea procesului OCR.",
    "Valorile extrase automat trebuie verificate înainte de utilizarea raportului în scopuri oficiale.",
],
"recommendations": [
    "Monitorizarea periodică a consumurilor pentru identificarea variațiilor neobișnuite.",
    "Extinderea colectării datelor pentru Scope 3: deșeuri, navetă, transport și achiziții.",
],
    }

    report_path = generate_report_pdf(context)

    report = Report(
        batch_id=batch.id,
        report_type="carbon_footprint_report",
        file_path=report_path,
        total_scope_1=round(total_scope_1, 2),
        total_scope_2=round(total_scope_2, 2),
        total_scope_3=round(total_scope_3, 2),
        total_co2e=round(total_co2e, 2),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Report generated successfully",
        "report_id": report.id,
        "batch_id": batch.id,
        "file_path": report.file_path,
        "download_url": f"/reports/download/{report.id}",
    }


@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename="co2nvert_carbon_report.pdf"
    )