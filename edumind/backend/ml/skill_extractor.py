import re

SKILL_KEYWORDS = {
    "python","java","javascript","typescript","c++","c#","go","rust","r","scala",
    "sql","postgresql","mysql","mongodb","redis","elasticsearch","sqlite",
    "html","css","react","vue","angular","node.js","express","next.js",
    "django","flask","fastapi","spring","laravel",
    "machine learning","deep learning","nlp","computer vision","data science",
    "tensorflow","pytorch","keras","scikit-learn","sklearn","xgboost",
    "pandas","numpy","matplotlib","seaborn","plotly","tableau","power bi",
    "docker","kubernetes","aws","gcp","azure","terraform","ansible","jenkins",
    "git","linux","bash","rest api","graphql","microservices",
    "spark","hadoop","kafka","airflow","dbt","snowflake",
    "statistics","probability","linear algebra","calculus",
    "data analysis","data visualization","etl","data pipeline",
    "mlops","ci/cd","agile","scrum","jira",
}

ROLE_SKILL_MAP = {
    "Data Scientist":["python","machine learning","statistics","pandas","sklearn","sql","data visualization","deep learning","nlp","numpy"],
    "ML Engineer":["python","tensorflow","pytorch","mlops","docker","kubernetes","spark","airflow","rest api","sklearn"],
    "Web Developer":["html","css","javascript","react","node.js","sql","rest api","git","typescript","next.js"],
    "Cloud Engineer":["aws","gcp","azure","docker","kubernetes","terraform","linux","bash","ci/cd","ansible"],
    "DevOps Engineer":["docker","kubernetes","ci/cd","linux","bash","terraform","aws","git","jenkins","monitoring"],
    "Cybersecurity Analyst":["linux","python","networking","sql","bash","security","penetration testing","firewalls"],
    "Product Manager":["agile","scrum","sql","data analysis","rest api","jira","product roadmap","analytics"],
    "AI Researcher":["python","pytorch","tensorflow","mathematics","deep learning","nlp","computer vision","statistics","research"],
}


def extract_skills_from_text(text: str) -> list:
    text_lower = text.lower()
    return sorted({s for s in SKILL_KEYWORDS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)})


def get_missing_skills(current: list, target_role: str) -> list:
    required = ROLE_SKILL_MAP.get(target_role, [])
    current_lower = {s.lower() for s in current}
    return [s for s in required if s.lower() not in current_lower]


def compute_match_score(current: list, target_role: str) -> float:
    required = ROLE_SKILL_MAP.get(target_role, [])
    if not required:
        return 50.0
    current_lower = {s.lower() for s in current}
    matched = sum(1 for s in required if s.lower() in current_lower)
    return round((matched / len(required)) * 100, 1)
