import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from datetime import datetime
from groq import Groq

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class GenReq(BaseModel):
    topic: str
    subject: Optional[str] = None
    num_questions: int = 10
    difficulty: str = "medium"
    question_type: str = "multiple_choice"
    context: Optional[str] = ""


class SubmitReq(BaseModel):
    quiz_id: str
    answers: List[int]
    time_taken_seconds: Optional[int] = None


def _grade(score: float) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"


def generate_quiz(topic: str, num_questions: int, difficulty: str,
                  question_type: str, context: str) -> list:
    prompt = f"""Generate {num_questions} {difficulty} difficulty quiz questions about "{topic}".
Question type: {question_type}.
{"Additional context: " + context if context else ""}

Return ONLY a JSON array, no explanation, no markdown, no extra text:
[
  {{
    "question": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "why this answer is correct"
  }}
]

Rules:
- "correct" must be the index (0-3) of the correct option
- Every question must have exactly 4 options
- Every question must have an explanation
- Return only the JSON array, nothing else"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=3000,
        )
        response_text = completion.choices[0].message.content
        clean = response_text.strip().replace("```json", "").replace("```", "")
        questions = json.loads(clean)
        valid = [
            q for q in questions
            if "question" in q
            and "options" in q
            and "correct" in q
            and "explanation" in q
            and isinstance(q["options"], list)
            and len(q["options"]) == 4
        ]
        return valid
    except json.JSONDecodeError:
        return []
    except Exception:
        return []


@router.post("/generate")
async def generate(
    data: GenReq,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    questions = generate_quiz(
        data.topic,
        data.num_questions,
        data.difficulty,
        data.question_type,
        data.context or "",
    )
    if not questions:
        raise HTTPException(
            500,
            "Failed to generate quiz. Check your Groq API key."
        )

    quiz = {
        "user_id": ObjectId(current_user["sub"]),
        "topic": data.topic,
        "subject": data.subject or data.topic,
        "difficulty": data.difficulty,
        "question_type": data.question_type,
        "questions": questions,
        "total_questions": len(questions),
        "created_at": datetime.utcnow(),
    }
    result = await db.quizzes.insert_one(quiz)
    quiz["id"] = str(result.inserted_id)
    quiz.pop("_id", None)
    quiz["user_id"] = str(quiz["user_id"])
    return quiz


@router.post("/submit")
async def submit(
    data: SubmitReq,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    quiz = await db.quizzes.find_one({"_id": ObjectId(data.quiz_id)})
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    questions = quiz["questions"]
    correct = sum(
        1 for i, a in enumerate(data.answers)
        if i < len(questions) and a == questions[i].get("correct")
    )
    total = len(questions)
    score = round((correct / total) * 100, 1) if total else 0
    grade = _grade(score)

    qs = {
        "user_id": ObjectId(current_user["sub"]),
        "quiz_id": ObjectId(data.quiz_id),
        "topic": quiz.get("topic", ""),
        "subject": quiz.get("subject", ""),
        "score": score,
        "correct_answers": correct,
        "total_questions": total,
        "grade": grade,
        "time_taken_seconds": data.time_taken_seconds,
        "answers": data.answers,
        "created_at": datetime.utcnow(),
    }
    await db.quiz_scores.insert_one(qs)

    xp = int(score / 10) * 5
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$inc": {"xp_points": xp}},
    )

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "grade": grade,
        "xp_earned": xp,
    }


@router.get("/history")
async def history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    scores = await db.quiz_scores.find(
        {"user_id": ObjectId(current_user["sub"])}
    ).sort("created_at", -1).limit(20).to_list(20)

    for s in scores:
        s["id"] = str(s.pop("_id"))
        s["user_id"] = str(s["user_id"])
        s["quiz_id"] = str(s["quiz_id"])

    return scores