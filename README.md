# EduMind AI

A full-stack AI-powered learning platform that turns study material into notes summaries, quizzes, flashcards, and a personalized learning path — with a KMeans-based weak-topic detector that flags what a student actually needs to review.

**Live app:** [edumind-ai-learning-platform.vercel.app](https://edumind-ai-learning-platform.vercel.app)
**API:** FastAPI backend on Render

---

## What it does

- **Notes & summarization** — upload PDF/DOCX/TXT/MD study material, extract text, and generate a structured summary (key concepts, study tips, difficulty level) via LLM
- **Quiz generation** — auto-generates multiple-choice quizzes on any topic with explanations, scored and graded on submission
- **Flashcards** — generates and rates spaced-repetition-style flashcards per topic
- **Weak topic detection** — clusters a student's topic scores with **scikit-learn KMeans** into severity tiers (high/medium/low), with a rule-based fallback when there isn't enough data to cluster
- **Performance & progress tracking** — grades and dashboards across quizzes and study activity
- **Resume analysis** — extracts skills from an uploaded resume via keyword matching, compares against a role's required skill set, and returns a match score, gaps, and top strengths
- **Study plans & learning paths** — generates a 2-week study schedule or a role-based learning roadmap (topics + resources) via LLM
- **Reminders, recommendations, and an admin panel** — for study reminders, course/resource suggestions, and user/content management

## Tech stack

**Backend:** FastAPI, MongoDB (Motor, async), JWT auth (python-jose + passlib/bcrypt), Groq API (`llama-3.1-8b-instant`) for LLM features, scikit-learn for topic clustering, PyPDF2/python-docx for document parsing

**Frontend:** React 18 + Vite, React Router, Tailwind CSS, Chart.js (via react-chartjs-2), Axios

**Deployment:** Backend on Render, frontend on Vercel

## Architecture

```
backend/
├── main.py              # FastAPI app, 16 routers mounted under /api
├── routers/              # auth, users, notes, summarize, chat, quiz,
│                          # flashcards, performance, progress, weak_topics,
│                          # resume, study_plan, learning_path, reminders,
│                          # recommendations, admin
├── services/
│   ├── ai_service.py     # Groq LLM calls (chat, summarize, quiz, flashcards,
│   │                      # resume analysis, study plan, learning path)
│   └── auth_service.py
├── ml/
│   ├── weak_topic_detector.py   # KMeans clustering over topic scores
│   └── skill_extractor.py       # keyword-based skill extraction + role matching
└── utils/                # file upload/text extraction, JWT helpers

frontend/
└── src/
    ├── pages/             # 17 pages (Dashboard, Chatbot, Quiz, Flashcards,
    │                       # Notes, Resume, StudyPlan, LearningPath, etc.)
    ├── components/common/  # Layout, Sidebar, PageWrapper
    ├── context/            # AuthContext
    └── services/api.js     # Axios client
```

Every protected route uses a JWT bearer token via `OAuth2PasswordBearer`, validated per-request through a `get_current_user` dependency.

## Running locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your MongoDB URI, JWT secret, and Groq API key
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev
```

API docs are auto-generated at `/docs` once the backend is running.

## Notes on scope

The weak-topic detector is the one place this project uses actual ML (KMeans clustering with a rule-based fallback for small datasets). The rest of the "AI" — quiz generation, summarization, flashcards, study plans, learning paths, resume gap analysis — is LLM prompting against the Groq API with JSON-structured outputs, not custom-trained models. Skill extraction for resumes is regex/keyword matching against a predefined skill list, not NLP-based entity extraction.
