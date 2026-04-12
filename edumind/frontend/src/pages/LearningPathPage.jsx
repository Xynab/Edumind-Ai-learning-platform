import { useState, useEffect } from "react";
import api from "../services/api";

const ROLES = [
  "Data Scientist",
  "ML Engineer",
  "Web Developer",
  "Cloud Engineer",
  "DevOps Engineer",
  "AI Researcher",
];

export default function LearningPathPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  // Read target role from localStorage, default to "Data Scientist"
  const [selectedRole, setSelectedRole] = useState(() => {
    return localStorage.getItem("target_role") || "Data Scientist";
  });

  // Save to localStorage whenever role changes
  const handleRoleChange = (e) => {
    const val = e.target.value;
    setSelectedRole(val);
    localStorage.setItem("target_role", val);
  };

  // Load existing path on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/learning-path/latest");
        const mods = res.data?.modules || res.data?.data?.modules || [];
        setModules(mods);
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
      const res = await api.post("/learning-path/generate", {
        skills: [],
        target_role: selectedRole,
      });
      const mods = res.data?.modules || res.data?.data?.modules || [];
      setModules(mods);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to generate learning path. Check your GROQ_API_KEY."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
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
            🗺️ Personalized Learning Path
          </h1>

          {/* Subtitle with inline role selector */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: 8, flexWrap: "wrap",
          }}>
            <span style={{ color: "var(--text2)", fontSize: 14 }}>
              AI-curated curriculum for
            </span>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
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
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
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
          {loading ? "⏳ Generating…" : "🤖 Generate Path"}
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

      {/* Loading spinner */}
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
            Generating your personalized learning path for{" "}
            <strong style={{ color: "var(--accent)" }}>{selectedRole}</strong>…
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && hasFetched && modules.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🗺️</div>
          <div style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 18, fontWeight: 600, marginBottom: 8,
          }}>
            No Learning Path Yet
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
            Click <strong>Generate Path</strong> to create your personalized
            curriculum for{" "}
            <strong style={{ color: "var(--accent)" }}>{selectedRole}</strong>.
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

      {/* Modules grid */}
      {!loading && modules.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))",
          gap: 16,
        }}>
          {modules.map((mod, i) => (
            <ModuleCard key={i} mod={mod} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

const COLORS = [
  "var(--accent)", "var(--cyan)", "var(--green)",
  "var(--amber)", "var(--pink)", "var(--red)",
];

function ModuleCard({ mod, index }) {
  const color     = COLORS[index % COLORS.length];
  const week      = mod.week      ?? index + 1;
  const title     = mod.title     ?? `Module ${week}`;
  const topics    = Array.isArray(mod.topics)    ? mod.topics    : [];
  const resources = Array.isArray(mod.resources) ? mod.resources : [];

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 16, padding: 20,
    }}>
      {/* Week badge + title */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, marginBottom: 12,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: `${color}22`, color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13,
        }}>
          {week}
        </div>
        <div style={{
          fontFamily: "Syne,sans-serif",
          fontSize: 15, fontWeight: 600, lineHeight: 1.3,
        }}>
          {title}
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: "var(--text2)", marginBottom: 6,
          }}>
            📚 Topics
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {topics.map((t, j) => (
              <li key={j} style={{
                fontSize: 13, color: "var(--text)",
                marginBottom: 3,
              }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: "var(--text2)", marginBottom: 6,
          }}>
            🔗 Resources
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {resources.map((r, j) => (
              <span key={j} style={{
                fontSize: 11,
                background: `${color}18`,
                color,
                border: `1px solid ${color}44`,
                padding: "3px 10px",
                borderRadius: 20,
                cursor: "default",
              }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}