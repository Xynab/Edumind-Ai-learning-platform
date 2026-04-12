import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from groq import Groq
from database import get_db
from utils.jwt_utils import get_current_user

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class GenerateReq(BaseModel):
    skills: Optional[List[str]] = []
    target_role: Optional[str] = "Data Scientist"


@router.post("/generate")
async def generate_learning_path(
    data: GenerateReq,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = current_user["sub"]

    skills_str = ", ".join(data.skills) if data.skills else "beginner"

    prompt = f"""You are a curriculum designer. Create a learning path for someone who wants to become a {data.target_role}.
Their current skills are: {skills_str}

Return ONLY this exact JSON structure, no explanation, no markdown, no extra text:
{{
  "modules": [
    {{
      "week": 1,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
    }},
    {{
      "week": 2,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
    }},
    {{
      "week": 3,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
    }},
    {{
      "week": 4,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
    }},
    {{
      "week": 5,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
    }},
    {{
      "week": 6,
      "title": "Module title here",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"]
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

    modules = data_parsed.get("modules", [])
    if not modules:
        raise HTTPException(500, "AI returned empty modules list")

    await db.learning_paths.update_one(
        {"user_id": user_id},
        {"$set": {
            "modules": modules,
            "target_role": data.target_role,
            "updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    return {"modules": modules}


@router.get("/latest")
async def get_latest(current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.learning_paths.find_one({"user_id": current_user["sub"]})
    if not doc:
        return {"has_data": False}
    return {
        "has_data": True,
        "modules": doc.get("modules", []),
        "target_role": doc.get("target_role", ""),
    }
