# EduMind AI — Full Stack Learning Platform

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Chart.js
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB (Motor async driver)
- **AI**: Groq Api
- **Auth**: JWT (python-jose + bcrypt)
- **File parsing**: PyMuPDF + python-docx

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in your keys
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL
npm run dev
```

### 3. MongoDB
- Install MongoDB Community: https://www.mongodb.com/try/download/community
- Or use free MongoDB Atlas cloud: https://www.mongodb.com/atlas
- Default connection: `mongodb://localhost:27017/edumind`

### 4. Get API Keys
- **Groq**: https://groq.com/ (free tier available)

## Environment Variables

### backend/.env
```
MONGODB_URL=mongodb://localhost:27017/edumind
SECRET_KEY=change-this-to-a-random-secret-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
Groq_KEY=your-groq-api-key
UPLOAD_DIR=./uploads
```

### frontend/.env
```
VITE_API_URL=http://localhost:8000/api
```

## Features
1. User Registration & Login (JWT auth, multi-user)
2. Dashboard with real stats
3. Upload Notes (PDF, DOCX, TXT)
4. AI Summarization 
5. AI Chatbot
6. Quiz Generation & Evaluation
7. Performance Analytics (real charts)
8. Weak Topic Detection (KMeans ML)
9. Personalized Study Plans
10. Course Recommendations
11. Progress Tracking with Heatmap
12. Pomodoro Timer
13. Flashcard Generator
14. Revision Reminders
15. Resume Analysis & Career Roadmap
16. Learning Path Generator
17. Admin Panel
