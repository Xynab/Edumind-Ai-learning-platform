import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Radar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler
);

const ACCENT  = "#7c6af7";
const PINK    = "#f472b6";
const CYAN    = "#22d3ee";
const GREEN   = "#4ade80";
const AMBER   = "#fbbf24";
const RED     = "#f87171";
const MUTED   = "#9893b0";
const SURFACE = "#1e1e2e";
const S2      = "#252538";

const chartBase = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: MUTED, font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.04)" } },
    y: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.06)" } },
  },
};

function gradeColor(g) {
  return { A: GREEN, B: CYAN, C: AMBER, D: AMBER, F: RED }[g] || MUTED;
}
function scoreColor(s) {
  if (s >= 80) return GREEN;
  if (s >= 60) return AMBER;
  return RED;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: SURFACE, border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -28, right: -28,
        width: 90, height: 90,
        background: `${color}18`, borderRadius: "50%",
      }} />
      <div style={{
        fontFamily: "Syne,sans-serif", fontSize: 28,
        fontWeight: 700, color, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: MUTED }}>{label}</div>
      {sub && (
        <div style={{
          fontSize: 12, marginTop: 6,
          color: sub.startsWith("+") ? GREEN : sub.startsWith("-") ? RED : MUTED,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: SURFACE,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20,
    }}>
      <div style={{
        fontFamily: "Syne,sans-serif", fontSize: 15,
        fontWeight: 600, marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "center", height: 300,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid rgba(124,106,247,0.2)",
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: MUTED, fontSize: 14 }}>
          Loading performance data…
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

const td = {
  padding: "12px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: 14,
};

export default function PerformancePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/performance/")
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load performance data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <div style={{ color: RED, padding: 32 }}>{error}</div>;

  if (!data?.has_data) return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "Syne,sans-serif",
          fontSize: 26, fontWeight: 700, marginBottom: 4,
        }}>
          📊 Performance Analysis
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Real-time insights computed from your quiz history
        </p>
      </div>
      <div style={{
        textAlign: "center", padding: "60px 20px",
        background: SURFACE, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
        <div style={{
          fontFamily: "Syne,sans-serif",
          fontSize: 18, fontWeight: 600, marginBottom: 8,
        }}>
          No Data Yet
        </div>
        <div style={{ color: MUTED, fontSize: 14 }}>
          {data?.message ||
            "Complete some quizzes to see your performance analysis."}
        </div>
      </div>
    </div>
  );

  const trendLabels = (data.score_trend || []).map(t => t.date);
  const trendScores = (data.score_trend || []).map(t => t.score);

  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: "Score %",
      data: trendScores,
      borderColor: ACCENT, backgroundColor: `${ACCENT}22`,
      tension: 0.4, fill: true,
      pointBackgroundColor: trendScores.map(s => scoreColor(s)),
      pointRadius: 5, pointHoverRadius: 7,
    }],
  };

  const subjectLabels = Object.keys(data.subject_breakdown || {});
  const subjectScores = Object.values(data.subject_breakdown || {});

  const radarData = {
    labels: subjectLabels,
    datasets: [{
      label: "Score %", data: subjectScores,
      backgroundColor: `${ACCENT}33`, borderColor: ACCENT,
      pointBackgroundColor: ACCENT, pointBorderColor: "#fff",
    }],
  };

  const gradeLabels = Object.keys(data.grade_distribution || {});
  const gradeCounts = Object.values(data.grade_distribution || {});
  const gradeColors = gradeLabels.map(g => gradeColor(g));

  const gradeData = {
    labels: gradeLabels,
    datasets: [{
      data: gradeCounts,
      backgroundColor: gradeColors.map(c => `${c}bb`),
      borderColor: gradeColors, borderWidth: 1,
    }],
  };

  const subjectBarData = {
    labels: subjectLabels,
    datasets: [{
      label: "Avg Score %", data: subjectScores,
      backgroundColor: subjectScores.map(s =>
        s >= 80 ? `${GREEN}99` : s >= 60 ? `${AMBER}99` : `${RED}99`
      ),
      borderRadius: 6,
    }],
  };

  const strengths = (data.strengths && data.strengths.length > 0)
    ? data.strengths
    : subjectLabels
        .map((s, i) => ({ subject: s, score: subjectScores[i] }))
        .filter(x => x.score >= 75)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

  const weaknesses = (data.weaknesses && data.weaknesses.length > 0)
    ? data.weaknesses
    : subjectLabels
        .map((s, i) => ({ subject: s, score: subjectScores[i] }))
        .filter(x => x.score < 75)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "Syne,sans-serif",
          fontSize: 26, fontWeight: 700, marginBottom: 4,
        }}>
          📊 Performance Analysis
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Real-time insights computed from your quiz history
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        gap: 16, marginBottom: 24,
      }}>
        <StatCard
          label="Overall Average" value={`${data.avg_score}%`}
          color={ACCENT}
          sub={data.improvement_rate >= 0
            ? `+${data.improvement_rate}% improvement`
            : `${data.improvement_rate}% change`}
        />
        <StatCard
          label="Best Score" value={`${data.best_score}%`}
          color={GREEN} sub="Personal best"
        />
        <StatCard
          label="Worst Score" value={`${data.worst_score}%`}
          color={RED} sub="Room to improve"
        />
        <StatCard
          label="Total Quizzes" value={data.total_quizzes}
          color={CYAN} sub="Completed"
        />
      </div>

      {/* CHARTS ROW 1 */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16, marginBottom: 16,
      }}>
        <ChartCard title="📈 Score Trend">
          <div style={{ height: 220 }}>
            {trendLabels.length > 0
              ? <Line data={trendData} options={{
                  ...chartBase,
                  scales: {
                    ...chartBase.scales,
                    y: {
                      ...chartBase.scales.y, min: 0, max: 100,
                      ticks: { color: MUTED, callback: v => `${v}%` },
                    },
                  },
                }} />
              : <p style={{
                  color: MUTED, fontSize: 13,
                  textAlign: "center", paddingTop: 80,
                }}>
                  Take more quizzes to see trend
                </p>
            }
          </div>
        </ChartCard>

        <ChartCard title="🎯 Subject Radar">
          <div style={{ height: 220 }}>
            {subjectLabels.length > 0
              ? <Radar data={radarData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      min: 0, max: 100,
                      ticks: {
                        color: MUTED, backdropColor: "transparent",
                        font: { size: 10 }, stepSize: 25,
                      },
                      grid: { color: "rgba(255,255,255,0.08)" },
                      pointLabels: { color: MUTED, font: { size: 11 } },
                    },
                  },
                }} />
              : <p style={{
                  color: MUTED, fontSize: 13,
                  textAlign: "center", paddingTop: 80,
                }}>
                  No subject data yet
                </p>
            }
          </div>
        </ChartCard>
      </div>

      {/* CHARTS ROW 2 */}
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 1fr",
        gap: 16, marginBottom: 16,
      }}>
        <ChartCard title="📚 Subject Breakdown">
          <div style={{ height: 220 }}>
            {subjectLabels.length > 0
              ? <Bar data={subjectBarData} options={{
                  ...chartBase,
                  scales: {
                    ...chartBase.scales,
                    y: {
                      ...chartBase.scales.y, min: 0, max: 100,
                      ticks: { color: MUTED, callback: v => `${v}%` },
                    },
                  },
                  plugins: { legend: { display: false } },
                }} />
              : <p style={{
                  color: MUTED, fontSize: 13,
                  textAlign: "center", paddingTop: 80,
                }}>
                  No subject data yet
                </p>
            }
          </div>
        </ChartCard>

        <ChartCard title="🏅 Grade Distribution">
          <div style={{ height: 220 }}>
            <Doughnut data={gradeData} options={{
              responsive: true, maintainAspectRatio: false, cutout: "60%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: MUTED, font: { size: 11 } },
                },
              },
            }} />
          </div>
        </ChartCard>
      </div>

      {/* STRENGTHS & WEAKNESSES */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16, marginBottom: 16,
      }}>

        {/* STRENGTHS */}
        <div style={{
          background: SURFACE,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 20,
        }}>
          <div style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 15, fontWeight: 600, marginBottom: 14,
          }}>
            🏆 Strengths
          </div>
          {strengths.length === 0
            ? (
              // ── UPDATED EMPTY STATE ──────────────────────
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
                  Complete more quizzes and score above 75%<br />
                  to unlock your strengths here.
                </p>
              </div>
            )
            : strengths.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px", background: S2,
                borderRadius: 10, marginBottom: 8,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 14 }}>{item.subject}</span>
                <span style={{
                  background: `${GREEN}22`, color: GREEN,
                  padding: "3px 10px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {item.score}%
                </span>
              </div>
            ))
          }
        </div>

        {/* WEAKNESSES */}
        <div style={{
          background: SURFACE,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 20,
        }}>
          <div style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 15, fontWeight: 600, marginBottom: 14,
          }}>
            📉 Areas to Improve
          </div>
          {weaknesses.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <p style={{ color: MUTED, fontSize: 13 }}>
                  {subjectLabels.length === 0
                    ? "Take quizzes to see areas for improvement."
                    : "All your subjects are above 75%! Great work."}
                </p>
              </div>
            )
            : weaknesses.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px", background: S2,
                borderRadius: 10, marginBottom: 8,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 14 }}>{item.subject}</span>
                <span style={{
                  background: `${RED}22`, color: RED,
                  padding: "3px 10px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {item.score}%
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* RECENT QUIZ HISTORY */}
      <ChartCard title="🕐 Recent Quiz History">
        {!data.recent_scores || data.recent_scores.length === 0
          ? <p style={{ color: MUTED, fontSize: 14 }}>No quiz history yet.</p>
          : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Topic", "Score", "Grade", "Correct / Total", "Date"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", fontSize: 12,
                      textTransform: "uppercase", letterSpacing: ".05em",
                      color: MUTED, padding: "10px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_scores.map((r, i) => (
                  <tr key={i}>
                    <td style={td}>{r.topic}</td>
                    <td style={td}>
                      <span style={{
                        color: scoreColor(r.score), fontWeight: 600,
                      }}>
                        {r.score}%
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{
                        background: `${gradeColor(r.grade)}22`,
                        color: gradeColor(r.grade),
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {r.grade}
                      </span>
                    </td>
                    <td style={{ ...td, color: MUTED }}>
                      {r.correct ?? "—"} / {r.total ?? "—"}
                    </td>
                    <td style={{ ...td, color: MUTED }}>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </ChartCard>
    </div>
  );
}