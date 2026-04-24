import os
import json
import re
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user
from utils.file_utils import save_upload, extract_text
from ml.skill_extractor import (extract_skills_from_text, get_missing_skills,
                                  compute_match_score, ROLE_SKILL_MAP)
from datetime import datetime
from groq import Groq

router = APIRouter()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

ROLES = list(ROLE_SKILL_MAP.keys())

SALARY_MAP = {
    "Data Scientist":        ("$80K",  "$130K"),
    "ML Engineer":           ("$100K", "$160K"),
    "Web Developer":         ("$70K",  "$120K"),
    "Cloud Engineer":        ("$90K",  "$150K"),
    "DevOps Engineer":       ("$85K",  "$140K"),
    "Cybersecurity Analyst": ("$80K",  "$130K"),
    "Product Manager":       ("$90K",  "$150K"),
    "AI Researcher":         ("$110K", "$180K"),
}

COURSE_DB = [
    {"title":"ML Specialization","provider":"Coursera","tags":["machine learning","python","sklearn"],"level":"intermediate","match_score":0},
    {"title":"Deep Learning","provider":"Fast.ai","tags":["deep learning","neural networks","pytorch"],"level":"advanced","match_score":0},
    {"title":"Python for Data Science","provider":"DataCamp","tags":["python","pandas","numpy"],"level":"beginner","match_score":0},
    {"title":"SQL Mastery","provider":"Udemy","tags":["sql","databases","postgresql"],"level":"intermediate","match_score":0},
    {"title":"Statistics for ML","provider":"Khan Academy","tags":["statistics","probability","math"],"level":"beginner","match_score":0},
    {"title":"MLOps Fundamentals","provider":"Google","tags":["mlops","docker","cloud","deployment"],"level":"advanced","match_score":0},
    {"title":"NLP with Transformers","provider":"HuggingFace","tags":["nlp","transformers","bert"],"level":"advanced","match_score":0},
    {"title":"React & Node.js","provider":"Udemy","tags":["react","javascript","node.js","html","css"],"level":"intermediate","match_score":0},
    {"title":"AWS Cloud Practitioner","provider":"AWS","tags":["aws","cloud","gcp","azure"],"level":"beginner","match_score":0},
    {"title":"Docker & Kubernetes","provider":"Udemy","tags":["docker","kubernetes","devops","ci/cd"],"level":"intermediate","match_score":0},
]


def call_groq_resume(resume_text: str, target_role: str) -> dict:
    prompt = f"""You are a resume analyzer. Extract skills from this resume and compare with {target_role} requirements.

Return ONLY this JSON object, no markdown, no explanation, no extra text:
{{
  "matchScore": 65,
  "currentSkills": ["python", "sql", "pandas"],
  "missingSkills": ["statistics", "sklearn", "deep learning"],
  "topStrengths": ["Backend Dev", "Data & ML", "Databases"]
}}

Rules:
- matchScore must be a number 0-100
- currentSkills: list all technical skills found in the resume
- missingSkills: skills required for {target_role} that are NOT in the resume
- topStrengths: 2-4 category labels for what the person is good at
- Return ONLY the JSON, nothing else

Resume:
{resume_text[:3000]}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )
        response_text = completion.choices[0].message.content
        clean = response_text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        return {
            "matchScore":    data.get("matchScore", 0),
            "currentSkills": data.get("currentSkills", []),
            "missingSkills": data.get("missingSkills", []),
            "topStrengths":  data.get("topStrengths", []),
        }
    except Exception as e:
        print(f"Groq resume error: {e}")
        print(f"Raw response: {response_text if 'response_text' in dir() else 'no response'}")
        return {}


def _course_recs(missing: list, current: list) -> list:
    needs = {s.lower() for s in missing + current}
    scored = []
    for c in COURSE_DB:
        hits = sum(1 for t in c["tags"] if any(t in n for n in needs))
        if hits:
            scored.append({**c, "match_score": round((hits / len(c["tags"])) * 100, 1)})
    return sorted(scored, key=lambda x: -x["match_score"])[:6]


def _parse_years_exp(text: str) -> int:
    matches = re.findall(r'(\d{4})\s*[-–]\s*(\d{4}|present|current)', text, re.I)
    total = 0
    for s, e in matches:
        end = 2025 if e.lower() in ("present", "current") else int(e)
        total += max(0, end - int(s))
    return total


def _default_strengths(skills: list) -> list:
    cats = {
        "Backend Dev": {"python","flask","fastapi","django","java","node.js"},
        "Data & ML":   {"machine learning","pandas","sklearn","scikit-learn","numpy"},
        "Cloud/DevOps":{"aws","gcp","azure","docker","kubernetes","terraform"},
        "Databases":   {"sql","postgresql","mysql","mongodb","redis"},
        "Frontend":    {"html","css","javascript","react","vue","typescript"},
    }
    sl = {s.lower() for s in skills}
    return [cat for cat, kw in cats.items() if sl & kw] or ["Programming"]


def _default_projects(missing: list) -> list:
    MAP = {
        "machine learning": {"name":"ML Pipeline","description":"End-to-end ML pipeline with training, evaluation & API deployment","skills":["Python","Scikit-learn","FastAPI","Docker"]},
        "deep learning":    {"name":"Image Classifier","description":"CNN trained on a public dataset with transfer learning","skills":["PyTorch","CNN","Python"]},
        "nlp":              {"name":"Sentiment Analyzer","description":"Fine-tune BERT on product reviews, deploy as REST API","skills":["HuggingFace","BERT","Flask"]},
        "docker":           {"name":"Containerised App","description":"Dockerise a Python app with CI/CD pipeline","skills":["Docker","GitHub Actions","FastAPI"]},
        "aws":              {"name":"Serverless Pipeline","description":"Serverless ETL with AWS Lambda, S3 and Glue","skills":["AWS Lambda","S3","Python"]},
        "sql":              {"name":"Analytics Dashboard","description":"PostgreSQL schema + complex queries + live dashboard","skills":["PostgreSQL","Python","Plotly"]},
        "react":            {"name":"Full-Stack App","description":"React frontend with FastAPI backend and MongoDB","skills":["React","FastAPI","MongoDB"]},
    }
    seen, out = set(), []
    for s in [m.lower() for m in missing]:
        for kw, proj in MAP.items():
            if kw in s and proj["name"] not in seen:
                out.append(proj)
                seen.add(proj["name"])
    defaults = [
        {"name":"Portfolio Site","description":"Deploy a personal site showcasing your projects","skills":["HTML","CSS","JavaScript"]},
        {"name":"REST API","description":"Full CRUD API with JWT auth and database","skills":["FastAPI","MongoDB","JWT"]},
    ]
    for d in defaults:
        if len(out) >= 3: break
        if d["name"] not in seen: out.append(d)
    return out[:4]


def _default_roadmap(missing: list, role: str) -> list:
    p1 = missing[:3] or ["Core fundamentals"]
    p2 = missing[3:6] or ["Build projects"]
    return [
        {"phase":"Phase 1 (Month 1–2)","focus":"Fill Critical Gaps",
         "items":[f"Learn {s}" for s in p1] + ["Daily coding practice","Take online courses"]},
        {"phase":"Phase 2 (Month 3–4)","focus":"Build Portfolio",
         "items":[f"Practice {s}" for s in p2] + ["Build 2-3 end-to-end projects","Publish to GitHub"]},
        {"phase":"Phase 3 (Month 5–6)","focus":f"Land {role} Role",
         "items":["Polish resume & LinkedIn","Apply to 10+ jobs/week","Interview prep","Network actively"]},
    ]


def _build_response(ai: dict, local_skills: list, target_role: str, resume_text: str) -> dict:
    current   = ai.get("currentSkills") or local_skills
    missing   = ai.get("missingSkills") or get_missing_skills(current, target_role)
    score     = ai.get("matchScore")
    if score is None or score == 0:
        score = compute_match_score(current, target_role)
    lo, hi    = SALARY_MAP.get(target_role, ("$70K", "$120K"))
    salary    = f"{lo} – {hi}"
    strengths = ai.get("topStrengths") or _default_strengths(current)
    projects  = _default_projects(missing)
    roadmap   = _default_roadmap(missing, target_role)
    courses   = _course_recs(missing, current)
    yrs       = _parse_years_exp(resume_text)
    return {
        "currentSkills":        current,
        "missingSkills":        missing,
        "matchScore":           round(float(score), 1),
        "roleMatch":            target_role,
        "salaryRange":          salary,
        "topStrengths":         strengths,
        "projects":             projects,
        "roadmap":              roadmap,
        "course_recommendations": courses,
        "yearsExperience":      yrs,
    }


class TextReq(BaseModel):
    resume_text: str
    target_role: str


@router.post("/analyze-text")
async def analyze_text(
    data: TextReq,
    current_user: dict = Depends(get_current_user),
):
    if not data.resume_text.strip():
        raise HTTPException(400, "Resume text cannot be empty")

    db = get_db()
    local_skills = extract_skills_from_text(data.resume_text)

    try:
        ai = call_groq_resume(data.resume_text, data.target_role)
    except Exception:
        ai = {}

    result = _build_response(ai, local_skills, data.target_role, data.resume_text)

    await db.resume_analyses.insert_one({
        "user_id":       ObjectId(current_user["sub"]),
        "target_role":   data.target_role,
        "current_skills": result["currentSkills"],
        "missing_skills": result["missingSkills"],
        "match_score":   result["matchScore"],
        "salary_range":  result["salaryRange"],
        "top_strengths": result["topStrengths"],
        "analyzed_at":   datetime.utcnow(),
    })

    return result


@router.post("/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    target_role: str = Form("Data Scientist"),
    current_user: dict = Depends(get_current_user),
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx", "txt"):
        raise HTTPException(400, "Only PDF, DOCX, TXT supported")
    saved = await save_upload(file, current_user["sub"])
    text  = extract_text(saved["file_path"], saved["file_type"])
    if not text.strip():
        raise HTTPException(422, "Could not extract text from file")
    req = TextReq(resume_text=text, target_role=target_role)
    return await analyze_text(req, current_user)


@router.get("/latest")
async def get_latest(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    rec = await db.resume_analyses.find_one(
        {"user_id": uid}, sort=[("analyzed_at", -1)]
    )
    if not rec:
        return {"has_data": False, "message": "No analysis yet. Upload your resume."}
    missing = get_missing_skills(rec.get("current_skills", []), rec.get("target_role", ""))
    courses = _course_recs(missing, rec.get("current_skills", []))
    return {
        "has_data":             True,
        "target_role":          rec.get("target_role"),
        "current_skills":       rec.get("current_skills", []),
        "missing_skills":       missing,
        "match_score":          rec.get("match_score", 0),
        "salary_range":         rec.get("salary_range", ""),
        "top_strengths":        rec.get("top_strengths", []),
        "course_recommendations": courses,
        "analyzed_at":          rec["analyzed_at"].isoformat() if rec.get("analyzed_at") else None,
    }


@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    return {"roles": [
        {"name": r, "required_skills": s, "skill_count": len(s)}
        for r, s in ROLE_SKILL_MAP.items()
    ]}