import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from groq import Groq

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class SumReq(BaseModel):
    text: Optional[str] = None
    topic: Optional[str] = ""


def call_groq_summarize(content: str, title: str = "") -> dict:
    prompt = f"""Analyze this study material and return ONLY a JSON object, no markdown, no extra text:
{{
  "summary": "2-3 sentence overview of the entire content",
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "study_tips": ["tip1", "tip2", "tip3"]
}}

Title: {title}
Study material:
{content[:3000]}

IMPORTANT: Return ONLY the JSON object. No explanation before or after."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )
        response_text = completion.choices[0].message.content
        clean = response_text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        return {
            "summary": data.get("summary", ""),
            "key_concepts": data.get("key_concepts", []),
            "study_tips": data.get("study_tips", []),
        }
    except json.JSONDecodeError:
        return {
            "summary": "Summary could not be generated. Please try again.",
            "key_concepts": [],
            "study_tips": [],
        }
    except Exception as e:
        return {
            "summary": f"Error generating summary: {str(e)}",
            "key_concepts": [],
            "study_tips": [],
        }


@router.post("/note/{note_id}")
async def summarize_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    note = await db.notes.find_one({
        "_id": ObjectId(note_id),
        "user_id": ObjectId(current_user["sub"]),
    })
    if not note:
        raise HTTPException(404, "Note not found")

    content = note.get("content", "")
    title   = note.get("title", "")

    if not content.strip():
        raise HTTPException(400, "Note has no content to summarize")

    result = call_groq_summarize(content, title)

    await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {
            "summary":       result.get("summary", ""),
            "key_concepts":  result.get("key_concepts", []),
            "study_tips":    result.get("study_tips", []),
            "is_summarized": True,
        }},
    )

    return result


@router.post("/text")
async def summarize_raw(
    data: SumReq,
    current_user: dict = Depends(get_current_user),
):
    if not (data.text or "").strip():
        raise HTTPException(400, "No text provided")
    return call_groq_summarize(data.text or "", data.topic or "")