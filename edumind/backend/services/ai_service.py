"""
AI service using Groq API (FREE, fast, stable)
"""

import json
import re
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

MODEL = "llama-3.1-8b-instant"


# ── core caller ───────────────────────────────────────────────

def _call(prompt: str, system: str = "") -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()


def _call_json(prompt: str, system: str = "") -> dict | list:
    raw = _call(prompt, system)
    clean = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", clean)
    if match:
        clean = match.group(1)
    return json.loads(clean)


# ── Chat ──────────────────────────────────────────────────────

def chat_response(message: str, history: list) -> str:
    system = (
        "You are EduMind AI, an expert educational tutor. "
        "Explain concepts clearly with examples. Be encouraging and concise."
    )

    messages = [{"role": "system", "content": system}]

    for h in history[-8:]:
        role = h.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": h.get("content", "")})

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()


# ── Summarization ─────────────────────────────────────────────

def summarize_text(text: str, topic: str = "") -> dict:
    system = "Return ONLY valid JSON."
    prompt = f"""Summarize this text about "{topic}":

Return JSON:
{{
  "summary": "short summary",
  "key_concepts": ["c1","c2","c3"],
  "important_facts": ["f1","f2"],
  "study_tips": ["t1","t2"],
  "difficulty": "beginner"
}}

Text:
{text[:3000]}
"""
    try:
        return _call_json(prompt, system)
    except Exception:
        return {"summary": text[:200], "key_concepts": []}


# ── Quiz ─────────────────────────────────────────────────────

def generate_quiz(topic: str, num: int, difficulty: str,
                  q_type: str, context: str = "") -> list:
    prompt = f"""Generate {num} MCQ questions about {topic}.
Return JSON list with options and correct index."""
    try:
        return _call_json(prompt)
    except Exception:
        return []


# ── Flashcards ───────────────────────────────────────────────

def generate_flashcards(topic: str, num: int = 8) -> list:
    prompt = f"""Generate {num} flashcards for {topic}.
Return JSON list."""
    try:
        return _call_json(prompt)
    except Exception:
        return []


# ── Resume Analysis ───────────────────────────────────────────

def analyze_resume(resume_text: str, target_role: str) -> dict:
    prompt = f"""Analyze resume for {target_role}. Return JSON."""
    try:
        return _call_json(prompt)
    except Exception:
        return {}


# ── Study Plan ────────────────────────────────────────────────

def generate_study_plan(subjects: list, daily_hours: float,
                         goal_date: str, style: str) -> dict:
    prompt = f"""Create study plan for {subjects}. Return JSON."""
    try:
        return _call_json(prompt)
    except Exception:
        return {}


# ── Learning Path ─────────────────────────────────────────────

def generate_learning_path(target_role: str, current_skills: list) -> dict:
    prompt = f"""Create roadmap for {target_role}. Return JSON."""
    try:
        return _call_json(prompt)
    except Exception:
        return {}


# ── Weak Topic Advice ─────────────────────────────────────────

def get_weak_topic_advice(topic: str) -> str:
    try:
        return _call(f"Give 5 tips to improve {topic}")
    except Exception:
        return "Practice regularly and revise basics."
