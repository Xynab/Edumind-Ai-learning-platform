import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import connect_db, close_db

from routers import (auth, users, notes, summarize, chat, quiz,
                     flashcards, performance, progress, weak_topics,
                     resume, study_plan, learning_path, reminders,
                     recommendations, admin)

app = FastAPI(title="EduMind AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://edumind-ai-learning-platform.vercel.app",
        "https://edumind-ai-learning-platform-kmalcs22j.vercel.app",
        "https://edumind-backend-vay5.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

PREFIX = "/api"
app.include_router(auth.router,            prefix=f"{PREFIX}/auth",            tags=["Auth"])
app.include_router(users.router,           prefix=f"{PREFIX}/users",           tags=["Users"])
app.include_router(notes.router,           prefix=f"{PREFIX}/notes",           tags=["Notes"])
app.include_router(summarize.router,       prefix=f"{PREFIX}/summarize",       tags=["Summarize"])
app.include_router(chat.router,            prefix=f"{PREFIX}/chat",            tags=["Chat"])
app.include_router(quiz.router,            prefix=f"{PREFIX}/quiz",            tags=["Quiz"])
app.include_router(flashcards.router,      prefix=f"{PREFIX}/flashcards",      tags=["Flashcards"])
app.include_router(performance.router,     prefix=f"{PREFIX}/performance",     tags=["Performance"])
app.include_router(progress.router,        prefix=f"{PREFIX}/progress",        tags=["Progress"])
app.include_router(weak_topics.router,     prefix=f"{PREFIX}/weak-topics",     tags=["WeakTopics"])
app.include_router(resume.router,          prefix=f"{PREFIX}/resume",          tags=["Resume"])
app.include_router(study_plan.router,      prefix=f"{PREFIX}/study-plan",      tags=["StudyPlan"])
app.include_router(learning_path.router,   prefix=f"{PREFIX}/learning-path",   tags=["LearningPath"])
app.include_router(reminders.router,       prefix=f"{PREFIX}/reminders",       tags=["Reminders"])
app.include_router(recommendations.router, prefix=f"{PREFIX}/recommendations",  tags=["Recommendations"])
app.include_router(admin.router,           prefix=f"{PREFIX}/admin",           tags=["Admin"])


@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await close_db()


@app.get("/")
async def root():
    return {"message": "EduMind AI API running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)