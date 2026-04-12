from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from utils.file_utils import save_upload, extract_text
from datetime import datetime

router = APIRouter()


def _fmt(n: dict) -> dict:
    n["id"] = str(n.pop("_id"))
    n["user_id"] = str(n["user_id"])
    return n


@router.post("/upload")
async def upload_note(
    file: UploadFile = File(...),
    subject: str = Form("General"),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    saved = await save_upload(file, current_user["sub"])
    text = extract_text(saved["file_path"], saved["file_type"])
    note = {
        "user_id": ObjectId(current_user["sub"]),
        "title": file.filename.rsplit(".", 1)[0],
        "subject": subject,
        "content": text[:8000],
        "file_path": saved["file_path"],
        "file_type": saved["file_type"],
        "file_size_mb": saved["file_size_mb"],
        "summary": None,
        "keywords": [],
        "is_summarized": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.notes.insert_one(note)
    note["_id"] = result.inserted_id
    return _fmt(note)


@router.get("/")
async def get_notes(current_user: dict = Depends(get_current_user)):
    db = get_db()
    notes = await db.notes.find(
        {"user_id": ObjectId(current_user["sub"])}
    ).sort("created_at", -1).to_list(100)
    return [_fmt(n) for n in notes]


@router.get("/{note_id}")
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    n = await db.notes.find_one({"_id": ObjectId(note_id), "user_id": ObjectId(current_user["sub"])})
    if not n:
        raise HTTPException(404, "Note not found")
    return _fmt(n)


@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notes.delete_one({"_id": ObjectId(note_id), "user_id": ObjectId(current_user["sub"])})
    return {"message": "Deleted"}
