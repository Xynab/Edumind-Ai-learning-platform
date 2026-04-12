from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from utils.jwt_utils import require_admin

router = APIRouter()


def _fmt_user(u: dict) -> dict:
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u


@router.get("/stats")
async def stats(current_user: dict = Depends(require_admin)):
    db = get_db()
    return {
        "total_users":  await db.users.count_documents({}),
        "total_notes":  await db.notes.count_documents({}),
        "total_quizzes":await db.quiz_scores.count_documents({}),
        "total_cards":  await db.flashcards.count_documents({}),
    }


@router.get("/users")
async def list_users(current_user: dict = Depends(require_admin)):
    db = get_db()
    users = await db.users.find({}).sort("created_at", -1).to_list(200)
    return [_fmt_user(u) for u in users]


@router.delete("/users/{uid}")
async def delete_user(uid: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    await db.users.delete_one({"_id": ObjectId(uid)})
    return {"message": "User deleted"}


@router.get("/notes")
async def list_notes(current_user: dict = Depends(require_admin)):
    db = get_db()
    notes = await db.notes.find({}).sort("created_at", -1).to_list(200)
    for n in notes:
        n["id"] = str(n.pop("_id"))
        n["user_id"] = str(n["user_id"])
    return notes


@router.delete("/notes/{nid}")
async def delete_note(nid: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    await db.notes.delete_one({"_id": ObjectId(nid)})
    return {"message": "Note deleted"}
