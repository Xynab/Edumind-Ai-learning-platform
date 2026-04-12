import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timedelta
from groq import Groq
from database import get_db
from utils.jwt_utils import get_current_user

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class GenReq(BaseModel):
    topic: str
    note_id: Optional[str] = None
    num_cards: int = 8


class RateReq(BaseModel):
    rating: str  # easy | medium | hard


@router.post("/generate")
async def generate(data: GenReq, current_user: dict = Depends(get_current_user)):
    db = get_db()

    prompt = f"""Generate {data.num_cards} flashcards about "{data.topic}".
Return ONLY a JSON array, no explanation, no markdown, no extra text:
[
  {{
    "question": "question text here",
    "answer": "answer text here"
  }}
]
Every item must have exactly "question" and "answer" keys."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )
        response_text = completion.choices[0].message.content
        clean = response_text.strip().replace("```json", "").replace("```", "")
        parsed = json.loads(clean)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(500, f"Groq API error: {e}")

    # Validate every card has both required keys
    cards_data = [c for c in parsed if "question" in c and "answer" in c]

    if not cards_data:
        raise HTTPException(500, "AI returned no valid flashcards")

    saved = []
    for c in cards_data:
        doc = {
            "user_id": ObjectId(current_user["sub"]),
            "note_id": ObjectId(data.note_id) if data.note_id else None,
            "topic": data.topic,
            "question": c["question"],
            "answer": c["answer"],
            "difficulty_rating": "medium",
            "review_count": 0,
            "next_review": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        }
        r = await db.flashcards.insert_one(doc)
        saved.append({
            "id": str(r.inserted_id),
            "topic": data.topic,
            "question": c["question"],
            "answer": c["answer"],
            "difficulty_rating": "medium",
            "review_count": 0,
        })

    return {"cards": saved}


@router.get("/")
async def get_cards(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cards = await db.flashcards.find(
        {"user_id": ObjectId(current_user["sub"])}
    ).sort("created_at", -1).to_list(200)
    out = []
    for c in cards:
        c["id"] = str(c.pop("_id"))
        c["user_id"] = str(c["user_id"])
        c.pop("note_id", None)
        if "created_at" in c and hasattr(c["created_at"], "isoformat"):
            c["created_at"] = c["created_at"].isoformat()
        if "next_review" in c and hasattr(c["next_review"], "isoformat"):
            c["next_review"] = c["next_review"].isoformat()
        out.append(c)
    return {"cards": out}


@router.patch("/{card_id}/rate")
async def rate_card(card_id: str, data: RateReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    days = {"easy": 7, "medium": 3, "hard": 1}.get(data.rating, 3)
    await db.flashcards.update_one(
        {"_id": ObjectId(card_id), "user_id": ObjectId(current_user["sub"])},
        {
            "$set": {
                "difficulty_rating": data.rating,
                "next_review": datetime.utcnow() + timedelta(days=days),
            },
            "$inc": {"review_count": 1},
        },
    )
    return {"message": "Rated"}


@router.delete("/{card_id}")
async def delete_card(card_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.flashcards.delete_one(
        {"_id": ObjectId(card_id), "user_id": ObjectId(current_user["sub"])}
    )
    return {"message": "Deleted"}
