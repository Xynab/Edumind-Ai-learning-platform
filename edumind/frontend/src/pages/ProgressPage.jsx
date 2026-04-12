import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const ACCENT  = "#7c6af7";
const CYAN    = "#22d3ee";
const GREEN   = "#4ade80";
const AMBER   = "#fbbf24";
const PINK    = "#f472b6";
const MUTED   = "#9893b0";
const SURFACE = "#1e1e2e";
const SURFACE2= "#252538";

const baseScales = {
  x: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.04)" } },
  y: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.06)" } },
};

// Heatmap intensity → color
function heatColor(count) {
  if (count === 0) return "rgba(255,255,255,0.04)";
  if (count === 1) return `${ACCENT}44`;
  if (count === 2) return `${ACCENT}88`;
  return ACCENT;
}

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      background: SURFACE2, borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "16px 20px", textAlign: "center",
    }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 700, color,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{
      background: SURFACE, border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20, ...style,
    }}>
      {title && (
        <div style={{
          fontFamily: "Syne, sans-serif", fontSize: 15,
          fontWeight: 600, marginBottom: 16,
        }}>{title}</div>
      )}
      {children}
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40,
          border: `3px solid rgba(124,106,247,0.2)`,
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: MUTED, fontSize: 14 }}>Loading progress data…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get("/progress/").then(r=>r.data)
      .then(setData)
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <div style={{ color: "#f87171", padding: 32 }}>{error}</div>;

  const noData = !data?.has_data;

  // ── weekly activity chart ──────────────────────────────────
  const weeklyLabels  = data?.weekly_activity?.map(d => d.day) ?? [];
  const weeklyQuizzes = data?.weekly_activity?.map(d => d.quizzes) ?? [];
  const weeklyAvg     = data?.weekly_activity?.map(d => d.avg_score) ?? [];

  const weeklyData = {
    labels: weeklyLabels,
    datasets: [
      {
        type: "bar",
        label: "Quizzes",
        data: weeklyQuizzes,
        backgroundColor: `${ACCENT}88`,
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Avg Score %",
        data: weeklyAvg,
        borderColor: CYAN,
        backgroundColor: "transparent",
        tension: 0.4,
        pointBackgroundColor: CYAN,
        pointRadius: 4,
        yAxisID: "y1",
      },
    ],
  };

  // ── monthly bar chart ──────────────────────────────────────
  const monthlyData = {
    labels: data?.monthly_activity?.map(w => w.week) ?? [],
    datasets: [{
      label: "Quizzes Completed",
      data: data?.monthly_activity?.map(w => w.quizzes) ?? [],
      backgroundColor: `${GREEN}88`,
      borderRadius: 6,
    }],
  };

  // ── notes per week ─────────────────────────────────────────
  const notesData = {
    labels: data?.notes_per_week?.map(w => w.week) ?? [],
    datasets: [{
      label: "Notes Uploaded",
      data: data?.notes_per_week?.map(w => w.notes) ?? [],
      backgroundColor: `${PINK}88`,
      borderRadius: 6,
    }],
  };

  // ── cumulative average line ────────────────────────────────
  const cumulativeData = {
    labels: data?.cumulative_trend?.map(d => `Q${d.quiz_num}`) ?? [],
    datasets: [{
      label: "Cumulative Avg %",
      data: data?.cumulative_trend?.map(d => d.cumulative_avg) ?? [],
      borderColor: AMBER,
      backgroundColor: `${AMBER}22`,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: AMBER,
    }],
  };

  const totals = data?.totals ?? {};
  const achievements = data?.achievements ?? [];

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          📈 Progress Tracking
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Your complete learning journey — computed from real activity
        </p>
      </div>

      {/* TOTAL STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <StatPill icon="🧠" label="Quizzes Taken"      value={totals.quizzes   ?? 0} color={ACCENT} />
        <StatPill icon="📄" label="Notes Uploaded"     value={totals.notes     ?? 0} color={CYAN}   />
        <StatPill icon="🃏" label="Flashcards Created" value={totals.flashcards ?? 0} color={PINK}   />
        <StatPill icon="⭐" label="Overall Average"    value={`${totals.overall_avg ?? 0}%`} color={GREEN} />
      </div>

      {noData && (
        <Card style={{ textAlign: "center", padding: "60px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📈</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No Activity Yet
          </div>
          <p style={{ color: MUTED, fontSize: 14 }}>
            Start taking quizzes and uploading notes to see your progress here.
          </p>
        </Card>
      )}

      {/* CHARTS ROW 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="📅 Weekly Activity (Quizzes + Avg Score)">
          <div style={{ height: 220 }}>
            <Bar data={weeklyData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: MUTED, font: { size: 11 } } } },
              scales: {
                x:  { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.04)" } },
                y:  { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.06)" }, position: "left" },
                y1: {
                  ticks: { color: CYAN, callback: v => `${v}%` },
                  grid:  { display: false },
                  position: "right", min: 0, max: 100,
                },
              },
            }} />
          </div>
        </Card>
        <Card title="📊 Monthly Quiz Volume">
          <div style={{ height: 220 }}>
            <Bar data={monthlyData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: baseScales.x, y: { ...baseScales.y, ticks: { color: MUTED } } },
            }} />
          </div>
        </Card>
      </div>

      {/* CHARTS ROW 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="📚 Notes Uploaded per Week">
          <div style={{ height: 220 }}>
            <Bar data={notesData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: baseScales.x, y: { ...baseScales.y, ticks: { color: MUTED } } },
            }} />
          </div>
        </Card>
        <Card title="📈 Cumulative Average Trend">
          <div style={{ height: 220 }}>
            {cumulativeData.labels.length === 0
              ? <p style={{ color: MUTED, fontSize: 14, paddingTop: 60, textAlign: "center" }}>
                  Take quizzes to see your learning curve.
                </p>
              : <Line data={cumulativeData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: baseScales.x,
                    y: { ...baseScales.y, min: 0, max: 100, ticks: { color: MUTED, callback: v => `${v}%` } },
                  },
                }} />
            }
          </div>
        </Card>
      </div>

      {/* ACHIEVEMENTS */}
      <Card title="🏅 Achievements" style={{ marginBottom: 16 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}>
          {achievements.map((a, i) => (
            <div key={i} style={{
              background: SURFACE2,
              border: `1px solid ${a.earned ? `${ACCENT}55` : "rgba(255,255,255,0.06)"}`,
              borderRadius: 12, padding: "16px 12px",
              textAlign: "center",
              opacity: a.earned ? 1 : 0.45,
              transition: "opacity .2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{a.desc}</div>
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: a.earned ? `${GREEN}22` : "rgba(255,255,255,0.06)",
                color: a.earned ? GREEN : MUTED,
                fontWeight: 600,
              }}>
                {a.earned ? "✅ Earned" : "🔒 Locked"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ACTIVITY HEATMAP */}
      <Card title="🗓️ Activity Heatmap (Last 15 Weeks)">
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 3,
        }}>
          {(data?.heatmap ?? []).map((cell, i) => (
            <div
              key={i}
              title={`${cell.date}: ${cell.count} quiz${cell.count !== 1 ? "zes" : ""}`}
              style={{
                width: 12, height: 12,
                borderRadius: 2,
                background: heatColor(cell.count),
                border: "1px solid rgba(255,255,255,0.04)",
                cursor: "default",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: MUTED }}>Less</span>
          {[0, 1, 2, 3].map(n => (
            <div key={n} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(n), border: "1px solid rgba(255,255,255,0.04)" }} />
          ))}
          <span style={{ fontSize: 11, color: MUTED }}>More</span>
        </div>
      </Card>
    </div>
  );
}
