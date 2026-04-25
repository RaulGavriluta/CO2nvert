from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, Activity, EmissionCategory
from app.services.text_extractor import extract_text
from app.services.ai_extractor import detect_document_type, extract_activity_from_text

router = APIRouter(prefix="/extract", tags=["Extraction"])


def get_category_code(document_type: str) -> str:
    if document_type == "fuel_receipt":
        return "scope_1_mobile_combustion"

    if document_type == "electricity_invoice":
        return "scope_2_purchased_electricity"

    if document_type == "gas_invoice":
        return "scope_1_stationary_combustion"

    if document_type == "thermal_invoice":
        return "scope_2_purchased_heating_cooling_steam"

    return "unknown"


@router.post("/{batch_id}")
def extract_batch(batch_id: int, db: Session = Depends(get_db)):
    documents = db.query(Document).filter(Document.batch_id == batch_id).all()

    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this batch")

    extracted_results = []

    for document in documents:
        try:
            text = extract_text(document.file_path)

            document.extracted_text = text
            document.document_type = detect_document_type(text)

            activity_data = extract_activity_from_text(
                text=text,
                document_type=document.document_type,
            )

            if not activity_data:
                document.status = "failed"

                extracted_results.append({
                    "document_id": document.id,
                    "filename": document.filename,
                    "document_type": document.document_type,
                    "status": "failed",
                    "error": "No activity extracted",
                    "extracted_text_preview": text[:500] if text else "",
                })

                continue

            category_code = get_category_code(document.document_type)

            category = (
                db.query(EmissionCategory)
                .filter(EmissionCategory.code == category_code)
                .first()
            )

            existing_activities = (
                db.query(Activity)
                .filter(Activity.document_id == document.id)
                .all()
            )

            for existing_activity in existing_activities:
                db.delete(existing_activity)

            db.flush()

            activity = Activity(
                document_id=document.id,
                category_id=category.id if category else None,
                activity_type=activity_data.get("activity_type"),
                scope=activity_data.get("scope"),
                quantity=activity_data.get("quantity", 0.0),
                unit=activity_data.get("unit"),
                confidence=activity_data.get("confidence", 0.0),
            )

            db.add(activity)
            db.flush()

            document.status = "processed"

            extracted_results.append({
                "document_id": document.id,
                "filename": document.filename,
                "document_type": document.document_type,
                "status": "processed",
                "extracted_text_preview": text[:500] if text else "",
                "activity": {
                    "activity_id": activity.id,
                    "activity_type": activity.activity_type,
                    "scope": activity.scope,
                    "quantity": activity.quantity,
                    "unit": activity.unit,
                    "confidence": activity.confidence,
                },
            })

        except Exception as e:
            document.status = "failed"

            extracted_results.append({
                "document_id": document.id,
                "filename": document.filename,
                "document_type": document.document_type,
                "status": "failed",
                "error": str(e),
            })

            continue

    db.commit()

    processed_count = sum(
        1 for result in extracted_results
        if result.get("status") == "processed"
    )

    failed_count = sum(
        1 for result in extracted_results
        if result.get("status") == "failed"
    )

    return {
        "message": "Extraction completed",
        "batch_id": batch_id,
        "documents_count": len(documents),
        "processed_count": processed_count,
        "failed_count": failed_count,
        "results": extracted_results,
    }