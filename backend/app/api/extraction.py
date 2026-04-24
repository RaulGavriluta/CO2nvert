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

    return "unknown"


@router.post("/{batch_id}")
def extract_batch(batch_id: int, db: Session = Depends(get_db)):
    documents = db.query(Document).filter(Document.batch_id == batch_id).all()

    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this batch")

    extracted_results = []

    for document in documents:
        text = extract_text(document.file_path)

        document.extracted_text = text
        document.document_type = detect_document_type(text)

        activity_data = extract_activity_from_text(
            text=text,
            document_type=document.document_type
        )

        category_code = get_category_code(document.document_type)

        category = (
            db.query(EmissionCategory)
            .filter(EmissionCategory.code == category_code)
            .first()
        )

        activity = Activity(
            document_id=document.id,
            category_id=category.id if category else None,
            activity_type=activity_data["activity_type"],
            scope=activity_data["scope"],
            quantity=activity_data["quantity"],
            unit=activity_data["unit"],
            confidence=activity_data["confidence"]
        )

        db.add(activity)
        document.status = "processed"

        extracted_results.append({
            "document_id": document.id,
            "filename": document.filename,
            "document_type": document.document_type,
            "extracted_text_preview": text[:500],
            "activity": activity_data
        })

    db.commit()

    return {
        "message": "Extraction completed",
        "batch_id": batch_id,
        "results": extracted_results
    }