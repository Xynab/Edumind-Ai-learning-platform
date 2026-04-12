from passlib.context import CryptContext
from fastapi import HTTPException
from database import get_db
from utils.jwt_utils import create_access_token
from datetime import datetime

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def register_user(name: str, email: str, password: str, goal: str = "") -> dict:
    db = get_db()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    safe_password = password[:72]
    user = {
        "name": name,
        "email": email,
        "password_hash": pwd.hash(safe_password),
        "role": "student",
        "plan": "free",
        "goal": goal,
        "xp_points": 0,
        "streak_days": 0,
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "is_active": True,
    }
    result = await db.users.insert_one(user)
    user_id = str(result.inserted_id)
    token = create_access_token({"sub": user_id, "email": email, "role": "student"})
    return {"access_token": token, "token_type": "bearer", "user_id": user_id,
            "name": name, "email": email, "role": "student", "plan": "free"}


async def login_user(email: str, password: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user or not pwd.verify(password[:72], user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_active": datetime.utcnow()}})
    token = create_access_token({"sub": user_id, "email": email, "role": user.get("role", "student")})
    return {"access_token": token, "token_type": "bearer", "user_id": user_id,
            "name": user["name"], "email": email, "role": user.get("role", "student"),
            "plan": user.get("plan", "free")}
