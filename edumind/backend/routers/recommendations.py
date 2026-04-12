from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from utils.jwt_utils import get_current_user

router = APIRouter()

COURSES = [
    {"title":"ML Specialization","provider":"Coursera","emoji":"🤖","level":"Intermediate","rating":"4.9","tags":["machine learning","python"],"type":"course"},
    {"title":"Deep Learning","provider":"Fast.ai","emoji":"🧠","level":"Advanced","rating":"4.8","tags":["deep learning","pytorch"],"type":"course"},
    {"title":"Python for DS","provider":"DataCamp","emoji":"🐍","level":"Beginner","rating":"4.7","tags":["python","pandas"],"type":"course"},
    {"title":"SQL Mastery","provider":"Udemy","emoji":"🗄️","level":"Intermediate","rating":"4.6","tags":["sql","databases"],"type":"course"},
    {"title":"Statistics","provider":"Khan Academy","emoji":"📊","level":"Beginner","rating":"4.8","tags":["statistics","math"],"type":"course"},
    {"title":"MLOps","provider":"Google","emoji":"☁️","level":"Advanced","rating":"4.7","tags":["mlops","docker","cloud"],"type":"course"},
]
BOOKS = [
    {"title":"Hands-on Machine Learning","author":"Aurélien Géron","emoji":"📘","match":"95%","type":"book"},
    {"title":"Deep Learning","author":"Ian Goodfellow","emoji":"📙","match":"88%","type":"book"},
    {"title":"Python Data Science Handbook","author":"VanderPlas","emoji":"📕","match":"91%","type":"book"},
    {"title":"Pattern Recognition","author":"Bishop","emoji":"📗","match":"82%","type":"book"},
]
PROJECTS = [
    {"title":"Stock Price Predictor","desc":"LSTM time series forecasting","skills":["Python","LSTM","Pandas"],"type":"project"},
    {"title":"Image Classifier","desc":"CNN to classify object categories","skills":["PyTorch","CNN"],"type":"project"},
    {"title":"Sentiment Analyzer","desc":"NLP model for product reviews","skills":["BERT","Flask"],"type":"project"},
    {"title":"Recommender System","desc":"Collaborative filtering for movies","skills":["Scikit-learn","SQL"],"type":"project"},
]


@router.get("/")
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    uid = ObjectId(current_user["sub"])
    # Get user's weak topics to personalise
    weak = await db.weak_topics.find({"user_id": uid}).to_list(10)
    weak_names = [w.get("topic","").lower() for w in weak]
    # Boost courses that match weak topics
    courses = []
    for c in COURSES:
        score = sum(1 for t in c["tags"] if any(t in w for w in weak_names)) * 20
        courses.append({**c, "match_score": min(95, 60 + score)})
    courses.sort(key=lambda x: -x["match_score"])
    return {"courses": courses, "books": BOOKS, "projects": PROJECTS}
