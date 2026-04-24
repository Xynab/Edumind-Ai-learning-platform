from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/")
async def get_progress(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    uid_str = str(current_user["sub"])
    now = datetime.utcnow()

    # Weekly activity – last 7 days
    weekly = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        d0  = day.replace(hour=0, minute=0, second=0, microsecond=0)
        d1  = day.replace(hour=23, minute=59, second=59)
        cnt = await db.quiz_scores.count_documents({
            "user_id": uid,
            "created_at": {"$gte": d0, "$lte": d1},
        })
        docs = await db.quiz_scores.find({
            "user_id": uid,
            "created_at": {"$gte": d0, "$lte": d1},
        }).to_list(100)
        avg = round(sum(d["score"] for d in docs) / len(docs), 1) if docs else 0
        weekly.append({
            "day":     day.strftime("%a"),
            "date":    day.strftime("%b %d"),
            "quizzes": cnt,
            "avg_score": avg,
        })

    # Monthly – last 4 weeks
    monthly = []
    for w in range(3, -1, -1):
        w0  = now - timedelta(weeks=w + 1)
        w1  = now - timedelta(weeks=w)
        cnt = await db.quiz_scores.count_documents({
            "user_id": uid,
            "created_at": {"$gte": w0, "$lte": w1},
        })
        monthly.append({"week": f"Wk {4 - w}", "quizzes": cnt})

    # Notes per week
    notes_pw = []
    for w in range(3, -1, -1):
        w0  = now - timedelta(weeks=w + 1)
        w1  = now - timedelta(weeks=w)
        cnt = await db.notes.count_documents({
            "user_id": uid,
            "created_at": {"$gte": w0, "$lte": w1},
        })
        notes_pw.append({"week": f"Wk {4 - w}", "notes": cnt})

    # Cumulative avg
    all_scores = await db.quiz_scores.find(
        {"user_id": uid}
    ).sort("created_at", 1).to_list(500)

    cumulative = []
    running = 0.0
    for i, s in enumerate(all_scores):
        running += s["score"]
        cumulative.append({
            "quiz_num":      i + 1,
            "cumulative_avg": round(running / (i + 1), 1),
            "date":          s["created_at"].strftime("%b %d"),
        })

    # Heatmap – last 105 days
    heatmap = []
    for i in range(104, -1, -1):
        day = now - timedelta(days=i)
        d0  = day.replace(hour=0, minute=0, second=0, microsecond=0)
        d1  = day.replace(hour=23, minute=59, second=59)
        cnt = await db.quiz_scores.count_documents({
            "user_id": uid,
            "created_at": {"$gte": d0, "$lte": d1},
        })
        heatmap.append({"date": day.strftime("%Y-%m-%d"), "count": cnt})

    # Totals
    tq = await db.quiz_scores.count_documents({"user_id": uid})
    tn = await db.notes.count_documents({"user_id": uid})

    # Flashcard count — handles both ObjectId and string user_id
    tc = await db.flashcards.count_documents({
        "$or": [
            {"user_id": uid},
            {"user_id": uid_str},
        ]
    })

    oa = round(
        sum(s["score"] for s in all_scores) / tq, 1
    ) if tq else 0

    achievements = [
        {
            "icon": "🏆", "name": "First Quiz",
            "desc": "Completed first quiz",
            "earned": tq >= 1,
        },
        {
            "icon": "📚", "name": "Note Taker",
            "desc": "Uploaded 5+ notes",
            "earned": tn >= 5,
        },
        {
            "icon": "🎯", "name": "Sharpshooter",
            "desc": "Scored 90%+ on a quiz",
            "earned": any(s["score"] >= 90 for s in all_scores),
        },
        {
            "icon": "📖", "name": "Dedicated",
            "desc": "Completed 10+ quizzes",
            "earned": tq >= 10,
        },
        {
            "icon": "⭐", "name": "High Achiever",
            "desc": "80%+ avg over 5+ quizzes",
            "earned": oa >= 80 and tq >= 5,
        },
        {
            "icon": "🚀", "name": "Quiz Master",
            "desc": "Completed 25+ quizzes",
            "earned": tq >= 25,
        },
    ]

    return {
        "has_data":        tq > 0 or tn > 0,
        "weekly_activity": weekly,
        "monthly_activity": monthly,
        "notes_per_week":  notes_pw,
        "cumulative_trend": cumulative,
        "heatmap":         heatmap,
        "achievements":    achievements,
        "totals": {
            "quizzes":     tq,
            "notes":       tn,
            "flashcards":  tc,
            "overall_avg": oa,
        },
    }