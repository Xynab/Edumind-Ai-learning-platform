import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/common/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";
import NotesPage from "./pages/NotesPage";
import QuizPage from "./pages/QuizPage";
import PerformancePage from "./pages/PerformancePage";
import ProgressPage from "./pages/ProgressPage";
import WeakTopicsPage from "./pages/WeakTopicsPage";
import ResumePage from "./pages/ResumePage";
import StudyPlanPage from "./pages/StudyPlanPage";
import LearningPathPage from "./pages/LearningPathPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import TimerPage from "./pages/TimerPage";
import RemindersPage from "./pages/RemindersPage";
import AdminPage from "./pages/AdminPage";

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#9893b0" }}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index                element={<DashboardPage />} />
            <Route path="chatbot"       element={<ChatbotPage />} />
            <Route path="notes"         element={<NotesPage />} />
            <Route path="quiz"          element={<QuizPage />} />
            <Route path="performance"   element={<PerformancePage />} />
            <Route path="progress"      element={<ProgressPage />} />
            <Route path="weak-topics"   element={<WeakTopicsPage />} />
            <Route path="resume"        element={<ResumePage />} />
            <Route path="study-plan"    element={<StudyPlanPage />} />
            <Route path="learning-path" element={<LearningPathPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="flashcards"    element={<FlashcardsPage />} />
            <Route path="timer"         element={<TimerPage />} />
            <Route path="reminders"     element={<RemindersPage />} />
            <Route path="admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
