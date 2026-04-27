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
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(124,106,247,0.2)",
        borderTop: "3px solid #7c6af7",
        animation: "spin .8s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color: "#9893b0", fontSize: 14 }}>Loading…</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role === "admin") return children;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: 16, padding: 24,
    }}>
      <div style={{ fontSize: 56 }}>🔒</div>
      <div style={{
        fontFamily: "Syne,sans-serif", fontSize: 22,
        fontWeight: 700, color: "var(--text)",
      }}>
        Access Denied
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14, textAlign: "center", maxWidth: 320 }}>
        You do not have permission to view this page.
        This area is restricted to administrators only.
      </p>
      <a href="/" style={{
        padding: "10px 24px", borderRadius: 10,
        background: "linear-gradient(135deg,var(--accent),#5b4de8)",
        color: "#fff", fontWeight: 500, fontSize: 14,
        textDecoration: "none",
      }}>
        ← Back to Dashboard
      </a>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: 16, padding: 24,
      background: "var(--bg)",
    }}>
      <div style={{ fontSize: 72, fontFamily: "Syne,sans-serif", fontWeight: 800, color: "var(--accent)" }}>
        404
      </div>
      <div style={{
        fontFamily: "Syne,sans-serif", fontSize: 22,
        fontWeight: 700, color: "var(--text)",
      }}>
        Page Not Found
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14, textAlign: "center", maxWidth: 320 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <a href="/" style={{
        padding: "10px 24px", borderRadius: 10,
        background: "linear-gradient(135deg,var(--accent),#5b4de8)",
        color: "#fff", fontWeight: 500, fontSize: 14,
        textDecoration: "none",
      }}>
        ← Back to Dashboard
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index                  element={<DashboardPage />} />
            <Route path="chatbot"         element={<ChatbotPage />} />
            <Route path="notes"           element={<NotesPage />} />
            <Route path="quiz"            element={<QuizPage />} />
            <Route path="performance"     element={<PerformancePage />} />
            <Route path="progress"        element={<ProgressPage />} />
            <Route path="weak-topics"     element={<WeakTopicsPage />} />
            <Route path="resume"          element={<ResumePage />} />
            <Route path="study-plan"      element={<StudyPlanPage />} />
            <Route path="learning-path"   element={<LearningPathPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="flashcards"      element={<FlashcardsPage />} />
            <Route path="timer"           element={<TimerPage />} />
            <Route path="reminders"       element={<RemindersPage />} />
            <Route path="admin"           element={<AdminOnly><AdminPage /></AdminOnly>} />
            <Route path="*"               element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
