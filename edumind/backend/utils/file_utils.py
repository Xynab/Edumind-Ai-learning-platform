import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from config import settings


async def save_upload(file: UploadFile, user_id: str) -> dict:
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "txt", "docx", "md"):
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail="File too large")
    user_dir = os.path.join(settings.UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(user_dir, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    return {"file_path": path, "file_type": ext, "file_size_mb": round(size_mb, 2)}


def extract_text(file_path: str, file_type: str) -> str:
    try:
        if file_type == "pdf":
            import fitz
            doc = fitz.open(file_path)
            return "\n".join(p.get_text() for p in doc)
        elif file_type == "docx":
            from docx import Document
            return "\n".join(p.text for p in Document(file_path).paragraphs)
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    except Exception as e:
        return f"[Text extraction failed: {e}]"
