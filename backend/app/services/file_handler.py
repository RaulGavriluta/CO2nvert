import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "storage/uploads"

ALLOWED_EXTENSIONS = {
    "pdf", "jpg", "jpeg", "png", "webp", "csv", "xlsx"
}


def get_file_extension(filename: str) -> str:
    return filename.split(".")[-1].lower()


def validate_file(file: UploadFile):
    extension = get_file_extension(file.filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type .{extension} is not supported"
        )


async def save_file(file: UploadFile):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    validate_file(file)

    extension = get_file_extension(file.filename)
    unique_filename = f"{uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return file_path, unique_filename