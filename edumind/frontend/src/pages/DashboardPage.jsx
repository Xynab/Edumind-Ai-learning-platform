import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, CardGrid, StatCard, Loader, Btn } from "../components/common/PageWrapper";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [perf, setPerf]   = useState(null);
  const [prog, setProg]   = useState(null);
  const [notes, setNotes] = useState([]);
  const [hist, setHist]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/performance/"),
      api.get("/progress/"),
      api.get("/notes/"),
      api.get("/quiz/history"),
    ]).then(([p, pr, n, h]) => {
      setPerf(p.data); setProg(pr.data);
      setNotes(n.data.slice(0, 3)); setHist(h.data.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading your dashboard…" />;

  const totals = prog?.totals || {};
  const weekly = prog?.weekly_activity || [];

  const chartData = {
    labels: weekly.map(w => w.day),
    datasets: [
      { label: "Quizzes", data: weekly.map(w => w.quizzes), backgroundColor: "rgba(124,106,247,0.7)", borderRadius: 6 },
      { label: "Avg Score", data: weekly.map(w => w.avg_score), backgroundColor: "rgba(244,114,182,0.6)", borderRadius: 6 },
    ],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#9893b0", font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: "#9893b0" }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#9893b0" }, grid: { color: "rgba(255,255,255,0.06)" } },
    },
  };

  const subjects = Object.entries(perf?.subject_breakdown || {}).slice(0, 5);

  return (
    <PageWrapper>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's your learning overview for today"
        action={
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate("/timer")}>⏱️ Start Study</Btn>
            <Btn size="sm" onClick={() => navigate("/chatbot")}>🤖 Ask AI</Btn>
          </div>
        }
      />

      {/* Stats */}
      <CardGrid cols={4} style={{ marginBottom: 20 }}>
        <StatCard label="Quizzes Taken"  value={totals.quizzes   ?? 0} color="var(--accent)" icon="🧠" />
        <StatCard label="Notes Uploaded" value={totals.notes      ?? 0} color="var(--cyan)"   icon="📄" />
        <StatCard label="Avg Score"      value={`${totals.overall_avg ?? 0}%`} color="var(--green)" icon="⭐" />
        <StatCard label="Flashcards"     value={totals.flashcards ?? 0} color="var(--amber)"  icon="🃏" />
      </CardGrid>

      {/* Row 2 */}
      <CardGrid cols={2} style={{ marginBottom: 20 }}>
        <Card>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14 }}>📊 Weekly Activity</div>
          <div style={{ height: 180 }}>
            {weekly.length ? <Bar data={chartData} options={chartOpts} /> :
              <p style={{ color:"var(--text2)", fontSize:14, paddingTop:60, textAlign:"center" }}>Take quizzes to see activity</p>}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14 }}>📚 Subject Progress</div>
          {subjects.length === 0
            ? <p style={{ color:"var(--text2)", fontSize:13 }}>No quiz data yet. Take a quiz to see subject progress.</p>
            : subjects.map(([sub, score]) => (
              <div key={sub} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontSize:13, width:140, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</span>
                <div style={{ flex:1, height:7, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${score}%`, background: score>=75?"var(--green)":score>=60?"var(--amber)":"var(--red)", borderRadius:99, transition:".5s" }} />
                </div>
                <span style={{ fontSize:12, color:"var(--text2)", width:34, textAlign:"right" }}>{score}%</span>
              </div>
            ))
          }
        </Card>
      </CardGrid>

      {/* Row 3 */}
      <CardGrid cols={3}>
        {/* Recent Notes */}
        <Card>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14 }}>📄 Recent Notes</div>
          {notes.length === 0
            ? <p style={{ color:"var(--text2)", fontSize:13 }}>No notes yet.</p>
            : notes.map(n => (
              <div key={n.id} onClick={() => navigate("/notes")}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                         padding:"10px 12px", background:"var(--surface2)", borderRadius:10,
                         marginBottom:8, cursor:"pointer", border:"1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{n.subject}</div>
                </div>
                <span style={{ fontSize:11, color:"var(--accent)", background:"rgba(124,106,247,0.12)", padding:"2px 8px", borderRadius:20 }}>
                  {n.is_summarized ? "Summarised" : "View"}
                </span>
              </div>
            ))}
          <Btn variant="ghost" size="sm" onClick={() => navigate("/notes")} style={{ marginTop:8, width:"100%", justifyContent:"center" }}>
            View All Notes →
          </Btn>
        </Card>

        {/* Recent Quiz History */}
        <Card>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14 }}>🧠 Recent Quizzes</div>
          {hist.length === 0
            ? <p style={{ color:"var(--text2)", fontSize:13 }}>No quizzes yet. Take one now!</p>
            : hist.map((h, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                     padding:"10px 12px", background:"var(--surface2)", borderRadius:10,
                                     marginBottom:8, border:"1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{h.topic}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{h.date || "Recent"}</div>
                </div>
                <span style={{
                  fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20,
                  background: h.score>=80?"rgba(74,222,128,0.15)":h.score>=60?"rgba(251,191,36,0.15)":"rgba(248,113,113,0.15)",
                  color: h.score>=80?"var(--green)":h.score>=60?"var(--amber)":"var(--red)",
                }}>{h.score}%</span>
              </div>
            ))}
          <Btn variant="ghost" size="sm" onClick={() => navigate("/quiz")} style={{ marginTop:8, width:"100%", justifyContent:"center" }}>
            Take a Quiz →
          </Btn>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14 }}>⚡ Quick Actions</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { icon:"📤", label:"Upload Notes",  to:"/notes" },
              { icon:"🧠", label:"Take Quiz",     to:"/quiz" },
              { icon:"🤖", label:"Ask AI Tutor",  to:"/chatbot" },
              { icon:"📋", label:"Resume AI",     to:"/resume" },
              { icon:"🃏", label:"Flashcards",    to:"/flashcards" },
              { icon:"📈", label:"Performance",   to:"/performance" },
            ].map(a => (
              <button key={a.to} onClick={() => navigate(a.to)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                         padding:"14px 8px", background:"var(--surface2)", border:"1px solid var(--border)",
                         borderRadius:10, cursor:"pointer", color:"var(--text2)", fontSize:12, fontWeight:500,
                         transition:".15s", fontFamily:"inherit" }}
                onMouseOver={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text2)"; }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </Card>
      </CardGrid>
    </PageWrapper>
  );
}
