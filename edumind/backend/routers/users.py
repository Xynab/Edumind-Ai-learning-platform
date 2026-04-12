from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from datetime import datetime

router = APIRouter()


def _fmt(u: dict) -> dict:
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not u:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found")
    return _fmt(u)


class UpdateReq(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None


@router.put("/me")
async def update_me(data: UpdateReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    upd = {k: v for k, v in data.dict().items() if v is not None}
    upd["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": upd})
    u = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    return _fmt(u)
