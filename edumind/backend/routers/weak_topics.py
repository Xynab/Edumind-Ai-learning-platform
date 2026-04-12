from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from ml.weak_topic_detector import detect_weak_topics
from datetime import datetime

router = APIRouter()


async def _build_topic_map(db, uid: ObjectId) -> dict:
    scores = await db.quiz_scores.find({"user_id": uid}).to_list(500)
    topic_map: dict = {}
    for s in scores:
        key = s.get("subject") or s.get("topic") or "General"
        topic_map.setdefault(key, []).append(s["score"])
    return {t: round(sum(v)/len(v), 1) for t, v in topic_map.items()}


@router.get("/")
async def get_weak_topics(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    topic_map = await _build_topic_map(db, uid)

    if not topic_map:
        return {"has_data": False,
                "message": "Take quizzes to detect weak topics.",
                "weak_topics": [], "topic_mastery": {}, "overall_mastery": 0,
                "total_topics": 0, "weak_count": 0}

    weak = detect_weak_topics(topic_map)

    # Persist weak topics for this user
    await db.weak_topics.delete_many({"user_id": uid})
    if weak:
        await db.weak_topics.insert_many([
            {**w, "user_id": uid, "detected_at": datetime.utcnow(), "resolved": False}
            for w in weak
        ])

    overall = round(sum(topic_map.values()) / len(topic_map), 1)
    return {
        "has_data": True,
        "weak_topics": weak,
        "topic_mastery": topic_map,
        "overall_mastery": overall,
        "total_topics": len(topic_map),
        "weak_count": len(weak),
    }


@router.post("/reanalyze")
async def reanalyze(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    topic_map = await _build_topic_map(db, uid)
    if not topic_map:
        return {"has_data": False, "weak_topics": [], "topic_mastery": {}, "overall_mastery": 0,
                "total_topics": 0, "weak_count": 0}
    weak = detect_weak_topics(topic_map)
    await db.weak_topics.delete_many({"user_id": uid})
    if weak:
        await db.weak_topics.insert_many([
            {**w, "user_id": uid, "detected_at": datetime.utcnow(), "resolved": False}
            for w in weak
        ])
    overall = round(sum(topic_map.values()) / len(topic_map), 1)
    return {"has_data": True, "weak_topics": weak, "topic_mastery": topic_map,
            "overall_mastery": overall, "total_topics": len(topic_map), "weak_count": len(weak)}
