import os
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
import requests
from PIL import Image
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY", "helloworld")

MAX_OCR_FILE_SIZE = 900 * 1024  # sub limita de 1024 KB


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text.strip()


def is_meaningful_text(text: str) -> bool:
    keywords = [
        "kwh", "mwh", "gj", "m3",
        "energie", "gaz", "gas",
        "incalzire", "încălzire",
        "apa calda", "apă caldă",
        "consum", "electricity", "natural gas",
        "termica", "termică",
        "termoficare", "termoenergetica",
    ]

    return any(keyword in text.lower() for keyword in keywords)


def compress_image_for_ocr(input_path: str) -> str:
    image = Image.open(input_path).convert("RGB")

    max_width = 1600
    if image.width > max_width:
        ratio = max_width / image.width
        new_height = int(image.height * ratio)
        image = image.resize((max_width, new_height))

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp_path = temp_file.name
    temp_file.close()

    quality = 85

    while quality >= 35:
        image.save(temp_path, "JPEG", quality=quality, optimize=True)

        if os.path.getsize(temp_path) <= MAX_OCR_FILE_SIZE:
            return temp_path

        quality -= 10

    return temp_path


def render_pdf_pages_to_images(file_path: str) -> list[str]:
    doc = fitz.open(file_path)
    image_paths = []

    for page in doc:
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        temp_path = temp_file.name
        temp_file.close()

        pix.save(temp_path)

        compressed_path = compress_image_for_ocr(temp_path)
        image_paths.append(compressed_path)

        if os.path.exists(temp_path) and temp_path != compressed_path:
            os.remove(temp_path)

    doc.close()
    return image_paths


def extract_text_with_ocr_space(file_path: str) -> str:
    url = "https://api.ocr.space/parse/image"

    with open(file_path, "rb") as file:
        response = requests.post(
            url,
            files={"file": file},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "OCREngine": 2,
                "scale": True,
                "detectOrientation": True,
            },
            timeout=60,
        )

    response.raise_for_status()
    result = response.json()

    if result.get("IsErroredOnProcessing"):
        error_message = result.get("ErrorMessage") or result.get("ErrorDetails")
        raise Exception(f"OCR.space error: {error_message}")

    parsed_results = result.get("ParsedResults", [])

    if not parsed_results:
        return ""

    return "\n".join(
        item.get("ParsedText", "")
        for item in parsed_results
    ).strip()


def extract_text_from_pdf_with_ocr(file_path: str) -> str:
    image_paths = render_pdf_pages_to_images(file_path)

    texts = []

    for image_path in image_paths:
        try:
            text = extract_text_with_ocr_space(image_path)
            texts.append(text)
        finally:
            if os.path.exists(image_path):
                os.remove(image_path)

    return "\n".join(texts).strip()


def extract_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        text = extract_text_from_pdf(file_path)

        if text and is_meaningful_text(text):
            return text

        return extract_text_from_pdf_with_ocr(file_path)

    if extension in [".jpg", ".jpeg", ".png", ".webp"]:
        compressed_path = compress_image_for_ocr(file_path)

        try:
            return extract_text_with_ocr_space(compressed_path)
        finally:
            if compressed_path != file_path and os.path.exists(compressed_path):
                os.remove(compressed_path)

    return ""