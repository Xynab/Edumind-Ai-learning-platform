from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from datetime import datetime, timedelta

router = APIRouter()


def _grade(s):
    return "A" if s >= 90 else "B" if s >= 80 else "C" if s >= 70 else "D" if s >= 60 else "F"


@router.get("/")
async def get_performance(current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = ObjectId(current_user["sub"])
    scores = await db.quiz_scores.find({"user_id": uid}).sort("created_at", 1).to_list(500)

    if not scores:
        return {
            "has_data": False,
            "message": "Complete some quizzes to see your performance analysis.",
            "overall_score": 0, "total_quizzes": 0,
            "best_score": 0, "worst_score": 0, "avg_score": 0,
            "score_trend": [], "subject_breakdown": {},
            "strengths": [], "weaknesses": [],
            "grade_distribution": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
            "recent_scores": [], "improvement_rate": 0,
        }

    all_s = [s["score"] for s in scores]
    avg   = round(sum(all_s) / len(all_s), 1)
    best  = round(max(all_s), 1)
    worst = round(min(all_s), 1)

    # Score trend – last 10
    trend = [{"date": s["created_at"].strftime("%b %d"), "score": round(s["score"], 1),
               "topic": s.get("topic", "Quiz"), "grade": _grade(s["score"])}
             for s in scores[-10:]]

    # Subject breakdown
    sub_map: dict = {}
    for s in scores:
        key = s.get("subject") or s.get("topic") or "General"
        sub_map.setdefault(key, []).append(s["score"])
    subject_avg = {k: round(sum(v)/len(v), 1) for k, v in sub_map.items()}

    strengths  = sorted([{"subject": k, "score": v} for k, v in subject_avg.items() if v >= 75],
                         key=lambda x: -x["score"])[:5]
    weaknesses = sorted([{"subject": k, "score": v} for k, v in subject_avg.items() if v < 75],
                         key=lambda x: x["score"])[:5]

    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for s in all_s:
        grade_dist[_grade(s)] += 1

    half = len(all_s) // 2
    improvement = round(sum(all_s[half:])/(len(all_s)-half) - sum(all_s[:half])/half, 1) if half > 0 else 0.0

    recent = [{"topic": s.get("topic","Quiz"), "score": round(s["score"],1),
                "grade": _grade(s["score"]), "date": s["created_at"].strftime("%b %d"),
                "correct": s.get("correct_answers"), "total": s.get("total_questions")}
              for s in reversed(scores[-5:])]

    return {
        "has_data": True,
        "overall_score": avg, "total_quizzes": len(scores),
        "best_score": best, "worst_score": worst, "avg_score": avg,
        "score_trend": trend, "subject_breakdown": subject_avg,
        "strengths": strengths, "weaknesses": weaknesses,
        "grade_distribution": grade_dist, "recent_scores": recent,
        "improvement_rate": improvement,
    }
