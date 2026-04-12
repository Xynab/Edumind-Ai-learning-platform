import { useState, useEffect } from "react";
import api from "../services/api";

const GOALS = [
  "Data Scientist",
  "ML Engineer",
  "Web Developer",
  "Cloud Engineer",
  "DevOps Engineer",
  "AI Researcher",
];

export default function StudyPlanPage() {
  const [weeks, setWeeks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  // Read from localStorage, fallback to defaults
  const [selectedGoal, setSelectedGoal] = useState(() => {
    return localStorage.getItem("goal") || "Data Scientist";
  });
  const [selectedHours, setSelectedHours] = useState(() => {
    return parseInt(localStorage.getItem("hours_per_day") || "3");
  });

  const handleGoalChange = (e) => {
    const val = e.target.value;
    setSelectedGoal(val);
    localStorage.setItem("goal", val);
  };

  const handleHoursChange = (e) => {
    const val = Math.min(8, Math.max(1, parseInt(e.target.value) || 3));
    setSelectedHours(val);
    localStorage.setItem("hours_per_day", String(val));
  };

  // Load saved plan on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/study-plan/latest");
        const w = res.data?.weeks || res.data?.data?.weeks || [];
        setWeeks(w);
        setHasFetched(true);
      } catch {
        setHasFetched(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/study-plan/generate", {
        goal: selectedGoal,
        hours_per_day: selectedHours,
        weak_topics: [],
      });
      const w = res.data?.weeks || res.data?.data?.weeks || [];
      setWeeks(w);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to generate study plan. Check your GROQ_API_KEY."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 26, fontWeight: 700, marginBottom: 8,
          }}>
            📅 Personalized Study Plan
          </h1>

          {/* Subtitle with inline selectors */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: 8, flexWrap: "wrap",
          }}>
            <span style={{ color: "var(--text2)", fontSize: 14 }}>
              AI-generated 2-week schedule ·
            </span>

            {/* Hours input */}
            <input
              type="number"
              min={1}
              max={8}
              value={selectedHours}
              onChange={handleHoursChange}
              style={{
                width: 44,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "3px 8px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                fontFamily: "inherit",
                outline: "none",
                textAlign: "center",
              }}
            />
            <span style={{ color: "var(--text2)", fontSize: 14 }}>
              hrs/day ·
            </span>

            {/* Goal dropdown */}
            <select
              value={selectedGoal}
              onChange={handleGoalChange}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "3px 10px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--accent)",
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {GOALS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 20px", border: "none", borderRadius: 10,
            background: "linear-gradient(135deg,var(--accent),#5b4de8)",
            color: "#fff", fontFamily: "inherit", fontSize: 14,
            fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {loading ? "⏳ Generating…" : "🤖 Generate Plan"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          color: "var(--red)", fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{
            width: 40, height: 40, margin: "0 auto 12px",
            border: "3px solid rgba(124,106,247,0.2)",
            borderTop: "3px solid var(--accent)",
            borderRadius: "50%",
            animation: "spin .8s linear infinite",
          }} />
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Generating your {selectedHours}-hour/day study plan
            for{" "}
            <strong style={{ color: "var(--accent)" }}>
              {selectedGoal}
            </strong>…
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && hasFetched && weeks.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📅</div>
          <div style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 18, fontWeight: 600, marginBottom: 8,
          }}>
            No Study Plan Yet
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
            Click <strong>Generate Plan</strong> to create your{" "}
            {selectedHours}-hour/day schedule for{" "}
            <strong style={{ color: "var(--accent)" }}>
              {selectedGoal}
            </strong>.
          </p>
          <button
            onClick={handleGenerate}
            style={{
              padding: "10px 24px", border: "none", borderRadius: 10,
              background: "linear-gradient(135deg,var(--accent),#5b4de8)",
              color: "#fff", fontFamily: "inherit", fontSize: 14,
              fontWeight: 500, cursor: "pointer",
            }}
          >
            🤖 Generate Now
          </button>
        </div>
      )}

      {/* Schedule */}
      {!loading && weeks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {weeks.map((week, wi) => (
            <WeekSection key={wi} week={week} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekSection({ week }) {
  const weekNum = week.week ?? 1;
  const days    = Array.isArray(week.days) ? week.days : [];

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Week header */}
      <div style={{
        padding: "14px 20px",
        background: "linear-gradient(135deg,rgba(124,106,247,0.1),rgba(244,114,182,0.05))",
        borderBottom: "1px solid var(--border)",
        fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 600,
      }}>
        📅 Week {weekNum}
      </div>

      {/* Days table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Day", "🌅 Morning", "☀️ Afternoon", "🌙 Evening"].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 12, textTransform: "uppercase",
                  letterSpacing: ".05em", color: "var(--text3)",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, di) => (
              <tr
                key={di}
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseOver={e =>
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)"
                }
                onMouseOut={e =>
                  e.currentTarget.style.background = "transparent"
                }
              >
                <td style={{
                  padding: "12px 16px", fontWeight: 600,
                  fontSize: 13, whiteSpace: "nowrap",
                  color: "var(--accent)", width: 110,
                }}>
                  {day.day ?? `Day ${di + 1}`}
                </td>
                <DayCell value={day.morning} />
                <DayCell value={day.afternoon} />
                <DayCell value={day.evening} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DayCell({ value }) {
  return (
    <td style={{
      padding: "12px 16px", fontSize: 13,
      color: "var(--text2)", lineHeight: 1.5,
    }}>
      {value || "—"}
    </td>
  );
}