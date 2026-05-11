from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models import Document, Activity, EmissionCategory
from app.services.text_extractor import extract_text
from app.services.ai_extractor import detect_document_type, extract_activity_from_text

# Configurare logging pentru a vedea erorile în consolă
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extract", tags=["Extraction"])

def get_category_code(document_type: str) -> str:
    mapping = {
        "fuel_receipt": "scope_1_mobile_combustion",
        "electricity_invoice": "scope_2_purchased_electricity",
        "gas_invoice": "scope_1_stationary_combustion",
        "thermal_invoice": "scope_2_purchased_heating_cooling_steam"
    }
    return mapping.get(document_type, "unknown")

@router.post("/{batch_id}")
def extract_batch(batch_id: int, db: Session = Depends(get_db)):
    # 1. Recuperăm documentele din batch
    documents = db.query(Document).filter(Document.batch_id == batch_id).all()

    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this batch")

    extracted_results = []

    for document in documents:
        try:
            # Resetăm starea sesiunii pentru fiecare document în caz de erori anterioare
            # 2. Extracție Text (OCR)
            text = extract_text(document.file_path)
            document.extracted_text = text
            
            # 3. Clasificare AI (Tip document)
            doc_type = detect_document_type(text)
            document.document_type = doc_type

            # 4. Extracție Date AI (Cantitate, Unitate, etc.)
            activity_data = extract_activity_from_text(
                text=text,
                document_type=doc_type,
            )

            if not activity_data:
                document.status = "failed"
                db.commit() # Salvăm statusul chiar dacă AI-ul nu a găsit date
                extracted_results.append({
                    "document_id": document.id,
                    "filename": document.filename,
                    "status": "failed",
                    "error": "AI could not find activity data",
                    "activity": None # Trimitem null ca să nu crape frontend-ul
                })
                continue

            # 5. Mapare Categorie Emisii
            category_code = get_category_code(doc_type)
            category = db.query(EmissionCategory).filter(EmissionCategory.code == category_code).first()

            # 6. Curățăm activitățile vechi pentru acest document (prevenim dublurile)
            db.query(Activity).filter(Activity.document_id == document.id).delete()
            
            # Important: Flush aici pentru a elibera lock-ul pe delete înainte de insert
            db.flush()

            # 7. Creare Activitate Nouă
            activity = Activity(
                document_id=document.id,
                category_id=category.id if category else None,
                activity_type=activity_data.get("activity_type"),
                scope=activity_data.get("scope"),
                quantity=float(activity_data.get("quantity", 0.0)),
                unit=activity_data.get("unit"),
                confidence=float(activity_data.get("confidence", 0.0)),
            )

            db.add(activity)
            document.status = "processed"
            
            # 8. Commit per document (mai sigur pentru SQLite "database is locked")
            db.commit()
            db.refresh(activity)

            extracted_results.append({
                "document_id": document.id,
                "filename": document.filename,
                "document_type": document.document_type,
                "status": "processed",
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
            # REZOLVARE EROARE: Rollback imediat dacă baza de date e blocată
            db.rollback()
            logger.error(f"Error processing document {document.id}: {str(e)}")
            
            document.status = "failed"
            # Încercăm să salvăm măcar statusul de eșec
            try:
                db.commit()
            except:
                db.rollback()

            extracted_results.append({
                "document_id": document.id,
                "filename": document.filename,
                "status": "failed",
                "error": str(e),
                "activity": None # Esențial pentru frontend (evită undefined.scope)
            })

    # Calculăm statisticile finale
    processed_count = sum(1 for r in extracted_results if r["status"] == "processed")
    failed_count = len(documents) - processed_count

    return {
        "message": "Extraction completed",
        "batch_id": batch_id,
        "documents_count": len(documents),
        "processed_count": processed_count,
        "failed_count": failed_count,
        "results": extracted_results,
    }