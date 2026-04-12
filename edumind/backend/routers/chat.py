import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from utils.jwt_utils import get_current_user
from services.ai_service import chat_response
from database import get_db

router = APIRouter()


class ChatReq(BaseModel):
    message: str
    history: Optional[List[dict]] = []


@router.post("/")
async def chat(data: ChatReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["sub"]

    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "user",
        "content": data.message,
        "timestamp": datetime.utcnow(),
    })

    reply = chat_response(data.message, data.history or [])

    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "assistant",
        "content": reply,
        "timestamp": datetime.utcnow(),
    })

    return {"reply": reply, "role": "assistant"}


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = await db.chat_history.find(
        {"user_id": current_user["sub"]}
    ).sort("timestamp", 1).to_list(50)

    messages = []
    for d in docs:
        messages.append({
            "role": d["role"],
            "content": d["content"],
            "timestamp": d["timestamp"].isoformat() if hasattr(d["timestamp"], "isoformat") else str(d["timestamp"]),
        })

    return {"messages": messages}


@router.delete("/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.chat_history.delete_many({"user_id": current_user["sub"]})
    return {"message": "Chat history cleared"}