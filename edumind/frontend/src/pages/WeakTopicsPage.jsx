import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ACCENT  = "#7c6af7";
const CYAN    = "#22d3ee";
const GREEN   = "#4ade80";
const AMBER   = "#fbbf24";
const RED     = "#f87171";
const MUTED   = "#9893b0";
const SURFACE = "#1e1e2e";
const SURFACE2= "#252538";

function severityColor(s) {
  return s === "high" ? RED : s === "medium" ? AMBER : GREEN;
}

function scoreColor(s) {
  if (s >= 75) return GREEN;
  if (s >= 60) return AMBER;
  return RED;
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        background: color,
        width: `${Math.min(value, 100)}%`,
        transition: "width .6s ease",
      }} />
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}22`, color, fontSize: 12, fontWeight: 500,
      padding: "3px 10px", borderRadius: 20,
    }}>{label}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: SURFACE, border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20, ...style,
    }}>{children}</div>
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
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: MUTED, fontSize: 14 }}>Running ML analysis…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        No Data to Analyse Yet
      </div>
      <p style={{ color: MUTED, fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
        Complete quizzes across different topics and subjects. The KMeans clustering model will
        automatically detect which areas need the most attention.
      </p>
    </Card>
  );
}

export default function WeakTopicsPage() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get("/weak-topics/").then(r=>r.data)
      .then(setData)
      .catch(() => setError("Failed to load weak topic analysis."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      const res = await api.post("/weak-topics/reanalyze").then(r=>r.data);
      setData(res);
    } catch {
      setError("Re-analysis failed.");
    } finally {
      setReanalyzing(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error)   return <div style={{ color: RED, padding: 32 }}>{error}</div>;

  const weakTopics  = data?.weak_topics  ?? [];
  const topicMastery = data?.topic_mastery ?? {};
  const hasData     = data?.has_data;

  // Topic mastery bar chart — all topics colour-coded
  const topicLabels  = Object.keys(topicMastery);
  const topicScores  = Object.values(topicMastery);
  const barColors    = topicScores.map(s => s >= 75 ? `${GREEN}99` : s >= 60 ? `${AMBER}99` : `${RED}99`);

  const barData = {
    labels: topicLabels,
    datasets: [{
      label: "Avg Score %",
      data: topicScores,
      backgroundColor: barColors,
      borderRadius: 6,
    }],
  };

  const overallMastery = data?.overall_mastery ?? 0;

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            🎯 Weak Topic Detection
          </h1>
          <p style={{ color: MUTED, fontSize: 14 }}>
            KMeans clustering on your quiz scores — automatically detects knowledge gaps
          </p>
        </div>
        <button
          onClick={handleReanalyze}
          disabled={reanalyzing}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${ACCENT}, #5b4de8)`,
            color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            cursor: reanalyzing ? "not-allowed" : "pointer",
            opacity: reanalyzing ? 0.7 : 1,
          }}
        >
          {reanalyzing ? "⏳ Analysing…" : "🤖 Re-analyse"}
        </button>
      </div>

      {!hasData
        ? <EmptyState />
        : <>
          {/* ML SUMMARY BANNER */}
          <Card style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(251,191,36,0.04))",
            border: "1px solid rgba(248,113,113,0.18)",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 36 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                  ML Analysis Complete
                </div>
                <div style={{ color: MUTED, fontSize: 13, marginBottom: 10 }}>
                  KMeans clustering on {data.total_topics} topic
                  {data.total_topics !== 1 ? "s" : ""} identified{" "}
                  <strong style={{ color: RED }}>{data.weak_count} weak area{data.weak_count !== 1 ? "s" : ""}</strong>{" "}
                  requiring attention.
                </div>
                <ProgressBar value={overallMastery} color={scoreColor(overallMastery)} />
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                  Overall mastery: {overallMastery}%
                </div>
              </div>
              <div style={{
                fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 700,
                color: scoreColor(overallMastery),
              }}>
                {overallMastery}%
              </div>
            </div>
          </Card>

          {/* WEAK TOPIC CARDS GRID */}
          {weakTopics.length === 0
            ? (
              <Card style={{ textAlign: "center", padding: "40px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No Weak Topics Found!</div>
                <p style={{ color: MUTED, fontSize: 14 }}>
                  All your topics are above the threshold. Keep up the great work!
                </p>
              </Card>
            )
            : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}>
                {weakTopics.map((t, i) => (
                  <WeakTopicCard key={i} topic={t} />
                ))}
              </div>
            )
          }

          {/* ALL TOPICS MASTERY CHART */}
          {topicLabels.length > 0 && (
            <Card>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                📊 Topic Mastery Map
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                {[
                  { label: "Strong (≥75%)", color: GREEN },
                  { label: "Average (60–74%)", color: AMBER },
                  { label: "Weak (<60%)", color: RED },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: `${l.color}99` }} />
                    <span style={{ fontSize: 12, color: MUTED }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: Math.max(240, topicLabels.length * 32) }}>
                <Bar
                  data={barData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        min: 0, max: 100,
                        ticks: { color: MUTED, callback: v => `${v}%` },
                        grid: { color: "rgba(255,255,255,0.05)" },
                      },
                      y: {
                        ticks: { color: MUTED, font: { size: 12 } },
                        grid: { color: "rgba(255,255,255,0.03)" },
                      },
                    },
                  }}
                />
              </div>
            </Card>
          )}

          {/* ALL TOPICS TABLE */}
          {topicLabels.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                📋 Full Topic Score Table
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Topic / Subject", "Avg Score", "Status", "Action"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", fontSize: 12, textTransform: "uppercase",
                        letterSpacing: ".05em", color: MUTED,
                        padding: "10px 14px",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topicLabels.map((topic, i) => {
                    const score = topicScores[i];
                    const wt = weakTopics.find(w => w.topic === topic);
                    return (
                      <tr key={i}>
                        <td style={tds}>{topic}</td>
                        <td style={tds}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 80 }}>
                              <ProgressBar value={score} color={scoreColor(score)} />
                            </div>
                            <span style={{ color: scoreColor(score), fontWeight: 600, fontSize: 13 }}>
                              {score}%
                            </span>
                          </div>
                        </td>
                        <td style={tds}>
                          {score >= 75
                            ? <Badge label="✅ Strong"   color={GREEN} />
                            : score >= 60
                              ? <Badge label="🔶 Average" color={AMBER} />
                              : <Badge label="⚠️ Weak"    color={RED}   />
                          }
                          {wt && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: MUTED }}>
                              {wt.cluster_label}
                            </span>
                          )}
                        </td>
                        <td style={tds}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <ActionBtn label="Practice" onClick={() => window.location.href = "/quiz"} />
                            <ActionBtn label="Ask AI"   onClick={() => window.location.href = "/chatbot"} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      }
    </div>
  );
}

// ── WeakTopicCard ─────────────────────────────────────────────
function WeakTopicCard({ topic }) {
  const color = severityColor(topic.severity);
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${color}44`,
      borderRadius: 16, padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Badge
          label={topic.severity === "high" ? "⚠️ High Priority" : "🔶 Medium"}
          color={color}
        />
        <span style={{
          fontSize: 11, color: MUTED,
          background: SURFACE2, padding: "3px 8px", borderRadius: 8,
        }}>
          {topic.cluster_label}
        </span>
      </div>

      <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        {topic.topic}
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <ProgressBar value={topic.score} color={color} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{topic.score}%</span>
      </div>

      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
        {topic.severity === "high"
          ? "Critical gap — this topic is significantly below your average. Focus here first."
          : "Below target — with focused practice you can close this gap quickly."}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn label="📖 Practice" onClick={() => window.location.href = "/quiz"} />
        <ActionBtn label="🤖 Explain"  onClick={() => window.location.href = "/chatbot"} />
        <ActionBtn label="🃏 Cards"    onClick={() => window.location.href = "/flashcards"} />
      </div>
    </div>
  );
}

// ── small reusable pieces ─────────────────────────────────────
function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        color: MUTED, cursor: "pointer", fontFamily: "inherit",
        transition: ".15s",
      }}
      onMouseOver={e => { e.target.style.background = "rgba(124,106,247,0.12)"; e.target.style.color = ACCENT; }}
      onMouseOut={e  => { e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.color = MUTED; }}
    >
      {label}
    </button>
  );
}

const tds = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: 14,
};
