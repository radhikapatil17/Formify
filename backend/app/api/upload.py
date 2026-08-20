import os
import uuid
import secrets
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def upload_file_api(
    file: UploadFile = File(...)
):
    """
    Handles multipart/form-data file uploads for public forms and form builder.
    Validates file size, saves to uploads directory, and returns file URL.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    content = await file.read()
    file_size = len(content)

    max_bytes = 25 * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 25MB limit")

    ext = os.path.splitext(file.filename)[1].lower()
    unique_prefix = f"{secrets.token_hex(6)}"
    safe_filename = f"{unique_prefix}_{uuid.uuid4().hex[:8]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{safe_filename}"

    return {
        "url": file_url,
        "filename": file.filename,
        "size_bytes": file_size,
        "content_type": file.content_type
    }
