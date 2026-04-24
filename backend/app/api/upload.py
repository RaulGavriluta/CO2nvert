from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from typing import List, Annotated  # Importăm Annotated

from app.database import get_db
from app.models import Batch, Document
from app.services.file_handler import save_file

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/")
async def upload_files(
    # Annotated forțează Swagger să genereze input-ul de tip 'multipart/form-data'
    files: Annotated[List[UploadFile], File(description="Selectează fișierele pentru upload")],
    db: Session = Depends(get_db)
):
    batch = Batch(
        name="CO2nvert Upload Batch",
        status="uploaded"
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    uploaded_documents = []

    for file in files:
        file_path, saved_filename = await save_file(file)

        document = Document(
            batch_id=batch.id,
            filename=saved_filename,
            file_path=file_path,
            file_type=file.content_type,
            document_type="unknown",
            status="uploaded"
        )

        db.add(document)
        uploaded_documents.append(document)

    db.commit()

    for document in uploaded_documents:
        db.refresh(document)

    return {
        "message": "Files uploaded successfully",
        "batch_id": batch.id,
        "files_uploaded": len(uploaded_documents),
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "file_type": document.file_type,
                "document_type": document.document_type,
                "status": document.status
            }
            for document in uploaded_documents
        ]
    }