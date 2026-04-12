from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from datetime import datetime

router = APIRouter()


class CreateReq(BaseModel):
    subject: str
    topic: str
    remind_at: str
    frequency: str = "weekly"
    priority: str = "medium"


@router.post("/")
async def create(data: CreateReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": ObjectId(current_user["sub"]),
        "subject": data.subject,
        "topic": data.topic,
        "remind_at": datetime.fromisoformat(data.remind_at),
        "frequency": data.frequency,
        "priority": data.priority,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    res = await db.reminders.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    doc["user_id"] = str(doc["user_id"])
    return doc


@router.get("/")
async def get_reminders(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    rems = await db.reminders.find({"user_id": uid}).sort("remind_at", 1).to_list(100)
    for r in rems:
        r["id"] = str(r.pop("_id"))
        r["user_id"] = str(r["user_id"])
    return rems


@router.patch("/{rid}/toggle")
async def toggle(rid: str, current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    rem = await db.reminders.find_one({"_id": ObjectId(rid), "user_id": uid})
    if not rem:
        raise HTTPException(404, "Not found")
    await db.reminders.update_one({"_id": ObjectId(rid)}, {"$set": {"is_active": not rem["is_active"]}})
    return {"message": "Toggled"}


@router.delete("/{rid}")
async def delete(rid: str, current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    await db.reminders.delete_one({"_id": ObjectId(rid), "user_id": uid})
    return {"message": "Deleted"}
