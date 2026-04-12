import { useState, useEffect } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, CardGrid, Btn, Loader, SectionTitle } from "../components/common/PageWrapper";

function QuizGenerator({ onStart }) {
  const [form, setForm] = useState({
    topic: "", subject: "", num_questions: 10,
    difficulty: "medium", question_type: "multiple_choice", context: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const generate = async () => {
    if (!form.topic.trim()) { setError("Please enter a topic."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/quiz/generate", {
        ...form, num_questions: parseInt(form.num_questions),
      });
      onStart(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Generation failed. Check your Groq API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionTitle>🎯 Generate AI Quiz</SectionTitle>
      <CardGrid cols={2} style={{ marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
            Topic *
          </label>
          <input {...f("topic")} placeholder="e.g. Machine Learning, SQL Joins…" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
            Subject
          </label>
          <input {...f("subject")} placeholder="e.g. Data Science" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
            Number of Questions
          </label>
          <select {...f("num_questions")}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
            Difficulty
          </label>
          <select {...f("difficulty")}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
            Question Type
          </label>
          <select {...f("question_type")}>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
      </CardGrid>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>
          Additional Context (optional)
        </label>
        <textarea
          {...f("context")}
          placeholder="Paste notes or specific topics to focus on…"
          style={{ height: 80, resize: "vertical" }}
        />
      </div>

      {error && (
        <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      <Btn onClick={generate} disabled={loading}>
        {loading ? "⏳ Generating Quiz…" : "🤖 Generate Quiz with AI"}
      </Btn>
    </Card>
  );
}

function QuizTaker({ quiz, onFinish }) {
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState([]);
  const [revealed, setRevealed]   = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [startTime]               = useState(Date.now());

  const q     = quiz.questions[current];
  const total = quiz.questions.length;

  const select = (optIdx) => {
    if (revealed.includes(current)) return;
    setAnswers(prev => { const a = [...prev]; a[current] = optIdx; return a; });
    setRevealed(prev => [...prev, current]);
  };

  const submit = async () => {
    setLoading(true);
    const timeSecs = Math.round((Date.now() - startTime) / 1000);
    const filled   = Array.from({ length: total }, (_, i) => answers[i] ?? -1);
    try {
      const res = await api.post("/quiz/submit", {
        quiz_id: quiz.id,
        answers: filled,
        time_taken_seconds: timeSecs,
      });
      setResult(res.data);
      setSubmitted(true);
    } catch {
      setResult({ score: 0, correct: 0, total, grade: "F", xp_earned: 0 });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    const sc  = result.score;
    const col = sc >= 80 ? "var(--green)" : sc >= 60 ? "var(--amber)" : "var(--red)";
    return (
      <Card style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>
          {sc >= 80 ? "🎉" : sc >= 60 ? "💪" : "📚"}
        </div>
        <div style={{
          fontFamily: "Syne,sans-serif", fontSize: 40,
          fontWeight: 800, color: col, marginBottom: 4,
        }}>
          {sc}%
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
          Grade: {result.grade}
        </div>
        <div style={{ color: "var(--text2)", marginBottom: 6 }}>
          {result.correct}/{result.total} correct
        </div>
        <div style={{ color: "var(--amber)", marginBottom: 24 }}>
          +{result.xp_earned} XP earned!
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={onFinish}>Back to Quiz</Btn>
          <Btn variant="ghost" onClick={() => window.location.href = "/performance"}>
            📊 View Analysis
          </Btn>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
      }}>
        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          Question {current + 1} of {total}
        </span>
        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          {answers.filter(a => a !== undefined).length} answered
        </span>
      </div>

      <div style={{
        height: 6, background: "rgba(255,255,255,0.07)",
        borderRadius: 99, overflow: "hidden", marginBottom: 20,
      }}>
        <div style={{
          height: "100%",
          width: `${((current + 1) / total) * 100}%`,
          background: "linear-gradient(90deg,var(--accent),var(--pink))",
          borderRadius: 99, transition: ".4s",
        }} />
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 20 }}>
        {q.question}
      </h3>

      <div style={{ marginBottom: 20 }}>
        {q.options.map((opt, i) => {
          const isSelected = answers[current] === i;
          const isCorrect  = revealed.includes(current) && i === q.correct;
          const isWrong    = revealed.includes(current) && isSelected && i !== q.correct;
          return (
            <div
              key={i}
              onClick={() => select(i)}
              style={{
                padding: "13px 16px", borderRadius: 10,
                marginBottom: 10,
                cursor: revealed.includes(current) ? "default" : "pointer",
                border: `1px solid ${
                  isCorrect ? "var(--green)"
                  : isWrong ? "var(--red)"
                  : isSelected ? "var(--accent)"
                  : "var(--border)"
                }`,
                background: isCorrect ? "rgba(74,222,128,0.08)"
                  : isWrong   ? "rgba(248,113,113,0.08)"
                  : isSelected ? "rgba(124,106,247,0.08)"
                  : "transparent",
                fontSize: 14, transition: ".15s",
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </div>
          );
        })}
      </div>

      {revealed.includes(current) && (
        <div style={{
          background: "rgba(124,106,247,0.06)",
          border: "1px solid rgba(124,106,247,0.2)",
          borderRadius: 10, padding: "10px 14px",
          fontSize: 13, color: "var(--accent)", marginBottom: 16,
        }}>
          💡 {q.explanation}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn
          variant="ghost"
          onClick={() => setCurrent(p => Math.max(0, p - 1))}
          disabled={current === 0}
        >
          ← Prev
        </Btn>
        <div style={{ display: "flex", gap: 8 }}>
          {current < total - 1 && (
            <Btn onClick={() => setCurrent(p => p + 1)}>Next →</Btn>
          )}
          {answers.filter(a => a !== undefined).length === total && (
            <Btn onClick={submit} disabled={loading}>
              {loading ? "Submitting…" : "📊 Submit Quiz"}
            </Btn>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function QuizPage() {
  const [activeQuiz, setActiveQuiz]     = useState(null);
  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(true);

  useEffect(() => {
    api.get("/quiz/history")
      .then(r => setHistory(r.data))
      .finally(() => setHistLoading(false));
  }, []);

  const onStart  = (quiz) => setActiveQuiz(quiz);
  const onFinish = () => {
    setActiveQuiz(null);
    api.get("/quiz/history").then(r => setHistory(r.data));
  };

  return (
    <PageWrapper>
      <PageHeader
        title="🧠 Quiz Center"
        subtitle="AI-generated quizzes · Real-time evaluation · Performance tracking"
      />
      {activeQuiz
        ? <QuizTaker quiz={activeQuiz} onFinish={onFinish} />
        : (
          <>
            <QuizGenerator onStart={onStart} />
            <Card style={{ marginTop: 20 }}>
              <SectionTitle>📋 Quiz History</SectionTitle>
              {histLoading
                ? <Loader text="Loading history…" />
                : history.length === 0
                  ? <p style={{ color: "var(--text2)", fontSize: 14 }}>
                      No quizzes taken yet. Generate one above!
                    </p>
                  : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Topic", "Score", "Grade", "Date"].map(h => (
                            <th key={h} style={{
                              textAlign: "left", fontSize: 12,
                              textTransform: "uppercase", letterSpacing: ".05em",
                              color: "var(--text3)", padding: "8px 12px",
                              borderBottom: "1px solid var(--border)",
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => {
                          const col = h.score >= 80
                            ? "var(--green)"
                            : h.score >= 60
                              ? "var(--amber)"
                              : "var(--red)";
                          return (
                            <tr key={i}>
                              <td style={tds}>{h.topic}</td>
                              <td style={tds}>
                                <span style={{ color: col, fontWeight: 600 }}>
                                  {h.score}%
                                </span>
                              </td>
                              <td style={tds}>
                                <span style={{
                                  fontSize: 12, padding: "3px 10px",
                                  borderRadius: 20,
                                  background: `${col}22`, color: col,
                                }}>
                                  {h.grade}
                                </span>
                              </td>
                              <td style={{ ...tds, color: "var(--text2)" }}>
                                {h.created_at?.slice(0, 10)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
              }
            </Card>
          </>
        )
      }
    </PageWrapper>
  );
}

const tds = {
  padding: "11px 12px",
  borderBottom: "1px solid var(--border)",
  fontSize: 14,
};