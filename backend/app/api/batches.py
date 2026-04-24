from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Batch, Document
from app.schemas.batch_schema import BatchResponse

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.get("/", response_model=list[BatchResponse])
def get_batches(db: Session = Depends(get_db)):
    batches = (
        db.query(Batch)
        .options(
            joinedload(Batch.documents).joinedload(Document.activities)
        )
        .order_by(Batch.created_at.desc())
        .all()
    )

    return batches


@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = (
        db.query(Batch)
        .options(
            joinedload(Batch.documents).joinedload(Document.activities)
        )
        .filter(Batch.id == batch_id)
        .first()
    )

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return batch