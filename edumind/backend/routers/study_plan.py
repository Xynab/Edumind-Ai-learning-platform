import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from groq import Groq
from database import get_db
from utils.jwt_utils import get_current_user

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class StudyPlanReq(BaseModel):
    goal: str = "Data Science"
    hours_per_day: int = 3
    weak_topics: Optional[List[str]] = []


@router.post("/generate")
async def generate_study_plan(
    data: StudyPlanReq,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = current_user["sub"]

    weak_str = ", ".join(data.weak_topics) if data.weak_topics else "none identified yet"

    prompt = f"""You are a study planner. Create a 2-week study plan for someone learning {data.goal}.
They have {data.hours_per_day} hours per day available.
Their weak topics are: {weak_str}

Return ONLY this exact JSON structure, no explanation, no markdown, no extra text:
{{
  "weeks": [
    {{
      "week": 1,
      "days": [
        {{"day": "Monday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Tuesday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Wednesday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Thursday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Friday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Saturday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Sunday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}}
      ]
    }},
    {{
      "week": 2,
      "days": [
        {{"day": "Monday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Tuesday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Wednesday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Thursday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Friday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Saturday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}},
        {{"day": "Sunday", "morning": "specific task here", "afternoon": "specific task here", "evening": "specific task here"}}
      ]
    }}
  ]
}}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )

        response_text = completion.choices[0].message.content
        clean = response_text.strip().replace("```json", "").replace("```", "")
        data_parsed = json.loads(clean)

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(500, f"Groq API error: {e}")

    weeks = data_parsed.get("weeks", [])
    if not weeks:
        raise HTTPException(500, "AI returned empty weeks list")

    await db.study_plans.update_one(
        {"user_id": user_id},
        {"$set": {
            "weeks": weeks,
            "goal": data.goal,
            "hours_per_day": data.hours_per_day,
            "updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    return {"weeks": weeks}


@router.get("/latest")
async def get_latest(current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.study_plans.find_one({"user_id": current_user["sub"]})
    if not doc:
        return {"has_data": False}
    return {
        "has_data": True,
        "weeks": doc.get("weeks", []),
        "goal": doc.get("goal", ""),
        "hours_per_day": doc.get("hours_per_day", 3),
    }
