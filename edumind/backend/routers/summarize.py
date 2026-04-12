from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from services.ai_service import summarize_text

router = APIRouter()


class SumReq(BaseModel):
    text: Optional[str] = None
    topic: Optional[str] = ""


@router.post("/note/{note_id}")
async def summarize_note(note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    note = await db.notes.find_one({"_id": ObjectId(note_id), "user_id": ObjectId(current_user["sub"])})
    if not note:
        raise HTTPException(404, "Note not found")
    result = summarize_text(note.get("content", ""), note.get("title", ""))
    await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {"summary": result.get("summary", ""), "keywords": result.get("key_concepts", []), "is_summarized": True}}
    )
    return result


@router.post("/text")
async def summarize_raw(data: SumReq, current_user: dict = Depends(get_current_user)):
    return summarize_text(data.text or "", data.topic or "")
