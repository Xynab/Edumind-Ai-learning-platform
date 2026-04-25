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
    system = "You are a study assistant. Return ONLY valid JSON, no explanation, no markdown."
    prompt = f"""Analyze this study material and return ONLY this JSON structure.
Replace ALL placeholder values with REAL content extracted from the study material.

{{
  "summary": "write a real 2-3 sentence overview of the actual content",
  "key_concepts": ["real concept 1 from the text", "real concept 2", "real concept 3", "real concept 4", "real concept 5"],
  "study_tips": ["practical tip 1 based on this content", "practical tip 2", "practical tip 3"],
  "difficulty": "beginner or intermediate or advanced"
}}

Study material to analyze:
{text[:3000]}

CRITICAL RULES:
- Do NOT copy the placeholder text above
- Extract REAL concepts from the study material
- Return ONLY the JSON object
- No text before or after the JSON"""

    try:
        result = _call_json(prompt, system)
        return {
            "summary":      result.get("summary", ""),
            "key_concepts": result.get("key_concepts", []),
            "study_tips":   result.get("study_tips", []) or result.get("important_facts", []),
            "difficulty":   result.get("difficulty", "beginner"),
        }
    except Exception as e:
        return {
            "summary":      text[:200] if text else "Could not generate summary.",
            "key_concepts": [],
            "study_tips":   [],
            "difficulty":   "beginner",
        }


# ── Quiz ─────────────────────────────────────────────────────

def generate_quiz(topic: str, num: int, difficulty: str,
                  q_type: str, context: str = "") -> list:
    prompt = f"""Generate {num} {difficulty} difficulty quiz questions about "{topic}".
{"Additional context: " + context if context else ""}

Return ONLY a JSON array:
[
  {{
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "why this answer is correct"
  }}
]

Rules:
- correct must be index 0-3
- every question needs exactly 4 options
- every question needs an explanation
- return ONLY the JSON array"""
    try:
        result = _call_json(prompt)
        if isinstance(result, list):
            return [
                q for q in result
                if "question" in q and "options" in q
                and "correct" in q and len(q.get("options", [])) == 4
            ]
        return []
    except Exception:
        return []


# ── Flashcards ───────────────────────────────────────────────

def generate_flashcards(topic: str, num: int = 8) -> list:
    prompt = f"""Generate {num} flashcards about "{topic}".

Return ONLY a JSON array:
[
  {{
    "question": "question or term",
    "answer": "answer or definition"
  }}
]

Return ONLY the JSON array, nothing else."""
    try:
        result = _call_json(prompt)
        if isinstance(result, list):
            return [c for c in result if "question" in c and "answer" in c]
        return []
    except Exception:
        return []


# ── Resume Analysis ───────────────────────────────────────────

def analyze_resume(resume_text: str, target_role: str) -> dict:
    prompt = f"""Extract skills from this resume and compare with {target_role} requirements.

Return ONLY this JSON object:
{{
  "matchScore": 65,
  "currentSkills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "topStrengths": ["strength category 1", "strength category 2"]
}}

Resume:
{resume_text[:2000]}

Return ONLY the JSON object, nothing else."""
    try:
        result = _call_json(prompt)
        if isinstance(result, dict):
            return result
        return {}
    except Exception:
        return {}


# ── Study Plan ────────────────────────────────────────────────

def generate_study_plan(subjects: list, daily_hours: float,
                         goal_date: str, style: str) -> dict:
    prompt = f"""Create a 2-week study plan for subjects: {subjects}.
Daily hours available: {daily_hours}.

Return ONLY a JSON object:
{{
  "weeks": [
    {{
      "week": 1,
      "days": [
        {{
          "day": "Monday",
          "morning": "specific task",
          "afternoon": "specific task",
          "evening": "specific task"
        }}
      ]
    }}
  ]
}}

Return ONLY the JSON object, nothing else."""
    try:
        result = _call_json(prompt)
        if isinstance(result, dict):
            return result
        return {}
    except Exception:
        return {}


# ── Learning Path ─────────────────────────────────────────────

def generate_learning_path(target_role: str, current_skills: list) -> dict:
    prompt = f"""Create a learning path for someone who wants to become a {target_role}.
Current skills: {current_skills}.

Return ONLY a JSON object:
{{
  "modules": [
    {{
      "week": 1,
      "title": "module title",
      "topics": ["topic1", "topic2"],
      "resources": ["resource1", "resource2"]
    }}
  ]
}}

Return ONLY the JSON object, nothing else."""
    try:
        result = _call_json(prompt)
        if isinstance(result, dict):
            return result
        return {}
    except Exception:
        return {}


# ── Weak Topic Advice ─────────────────────────────────────────

def get_weak_topic_advice(topic: str) -> str:
    try:
        return _call(
            f"Give 5 clear and practical tips to help a student improve at {topic}. "
            f"Be specific and actionable."
        )
    except Exception:
        return "Practice regularly and revise the basics consistently."