import { useState, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Radar } from "react-chartjs-2";
import api from "../services/api";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// ── design tokens ─────────────────────────────────────────────
const C = {
  accent:   "#7c6af7",
  accent2:  "#5b4de8",
  pink:     "#f472b6",
  cyan:     "#22d3ee",
  green:    "#4ade80",
  amber:    "#fbbf24",
  red:      "#f87171",
  muted:    "#9893b0",
  surface:  "#1e1e2e",
  surface2: "#252538",
  border:   "rgba(255,255,255,0.07)",
  border2:  "rgba(255,255,255,0.12)",
};

const ROLES = [
  "Data Scientist",
  "ML Engineer",
  "Web Developer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Product Manager",
  "AI Researcher",
];

// ─────────────────────────────────────────────────────────────
// tiny reusable atoms
// ─────────────────────────────────────────────────────────────
function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${glow ? `${C.accent}44` : C.border}`,
      borderRadius: 16,
      padding: 20,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {glow && (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${C.accent}08, ${C.pink}04)`,
          pointerEvents: "none",
        }} />
      )}
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "Syne, sans-serif",
      fontSize: 15, fontWeight: 600,
      marginBottom: 16,
      display: "flex", alignItems: "center", gap: 8,
    }}>{children}</div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 11px", borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: bg || `${color}22`,
      color: color,
      margin: 3,
    }}>{label}</span>
  );
}

function ProgressBar({ value, color, height = 7 }) {
  return (
    <div style={{
      height, background: "rgba(255,255,255,0.07)",
      borderRadius: 99, overflow: "hidden",
    }}>
      <div style={{
        height: "100%", borderRadius: 99,
        width: `${Math.min(Math.max(value, 0), 100)}%`,
        background: color,
        transition: "width .7s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 10, border: "none",
    fontFamily: "inherit", fontSize: 14, fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: ".2s",
    ...style,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg,${C.accent},${C.accent2})`, color: "#fff" },
    ghost:   { background: "transparent", color: C.muted, border: `1px solid ${C.border2}` },
    danger:  { background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}33` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Loader({ text = "Analysing your resume with AI…" }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{
        width: 44, height: 44,
        border: `3px solid ${C.accent}33`,
        borderTop: `3px solid ${C.accent}`,
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
        margin: "0 auto 16px",
      }} />
      <div style={{ color: C.muted, fontSize: 14 }}>{text}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ScoreRing({ score }) {
  const color = score >= 70 ? C.green : score >= 45 ? C.amber : C.red;
  const r = 72, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto" }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.pink} />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} fill="none" stroke={C.surface2} strokeWidth="10" />
        <circle
          cx="90" cy="90" r={r} fill="none"
          stroke={score >= 70 ? "url(#ringGrad)" : color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 34, fontWeight: 800, color,
          lineHeight: 1,
        }}>{score}%</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Match Score</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// upload / drop zone
// ─────────────────────────────────────────────────────────────
function UploadZone({ onFile, dragging, setDragging }) {
  const inputRef = useRef();
  const handle = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext)) {
      alert("Only PDF, DOCX and TXT files are supported.");
      return;
    }
    onFile(file);
  };
  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? C.accent : C.border2}`,
        borderRadius: 14, padding: "36px 24px",
        textAlign: "center", cursor: "pointer",
        background: dragging ? `${C.accent}0a` : "transparent",
        transition: ".2s",
      }}
    >
      <div style={{ fontSize: 38, marginBottom: 10 }}>📄</div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
        Drop your resume here or click to browse
      </div>
      <div style={{ fontSize: 12, color: C.muted }}>PDF, DOCX, TXT supported · Max 50 MB</div>
      <input
        ref={inputRef} type="file" accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
        onChange={e => handle(e.target.files[0])}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// skill gap doughnut
// ─────────────────────────────────────────────────────────────
function SkillGapChart({ have, missing }) {
  const data = {
    labels: ["Skills You Have", "Skills to Learn"],
    datasets: [{
      data: [have, missing],
      backgroundColor: [`${C.green}bb`, `${C.red}bb`],
      borderColor:     [C.green, C.red],
      borderWidth: 1,
    }],
  };
  return (
    <div style={{ height: 220 }}>
      <Doughnut data={data} options={{
        responsive: true, maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: C.muted, font: { size: 11 }, padding: 14 },
          },
        },
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// radar chart for skill categories
// ─────────────────────────────────────────────────────────────
function SkillRadar({ currentSkills, missingSkills }) {
  const CATEGORIES = {
    "Python / Backend":  ["python", "flask", "fastapi", "django", "java"],
    "Data & ML":        ["machine learning", "pandas", "numpy", "sklearn", "scikit-learn"],
    "Deep Learning":    ["deep learning", "tensorflow", "pytorch", "keras"],
    "Cloud & DevOps":   ["aws", "gcp", "azure", "docker", "kubernetes"],
    "Databases":        ["sql", "postgresql", "mysql", "mongodb", "redis"],
    "Frontend":         ["html", "css", "javascript", "react", "vue"],
  };
  const all = [...currentSkills, ...missingSkills].map(s => s.toLowerCase());
  const have = currentSkills.map(s => s.toLowerCase());

  const scores = Object.entries(CATEGORIES).map(([, keywords]) => {
    const total = keywords.filter(k => all.some(s => s.includes(k))).length || 1;
    const got   = keywords.filter(k => have.some(s => s.includes(k))).length;
    return Math.round((got / total) * 100);
  });

  const radarData = {
    labels: Object.keys(CATEGORIES),
    datasets: [{
      label: "Your Skills",
      data: scores,
      backgroundColor: `${C.accent}33`,
      borderColor: C.accent,
      pointBackgroundColor: C.accent,
      pointBorderColor: "#fff",
    }],
  };
  return (
    <div style={{ height: 240 }}>
      <Radar data={radarData} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { color: C.muted, backdropColor: "transparent", font: { size: 9 }, stepSize: 25 },
            grid:  { color: "rgba(255,255,255,0.08)" },
            pointLabels: { color: C.muted, font: { size: 11 } },
          },
        },
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// per-skill bar chart
// ─────────────────────────────────────────────────────────────
function SkillBarsChart({ required, current }) {
  const currentLower = current.map(s => s.toLowerCase());
  const labels  = required.slice(0, 12);
  const scores  = labels.map(s => currentLower.some(c => c.includes(s.toLowerCase())) ? 100 : 0);
  const colors  = scores.map(v => v === 100 ? `${C.green}aa` : `${C.red}aa`);

  const data = {
    labels,
    datasets: [{
      label: "Have",
      data: scores,
      backgroundColor: colors,
      borderRadius: 6,
    }],
  };
  return (
    <div style={{ height: Math.max(200, labels.length * 28) }}>
      <Bar data={data} options={{
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            min: 0, max: 100,
            ticks: { color: C.muted, callback: v => v === 100 ? "✓" : "✗" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: { ticks: { color: C.muted, font: { size: 12 } }, grid: { display: false } },
        },
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// roadmap timeline
// ─────────────────────────────────────────────────────────────
function Roadmap({ phases }) {
  const phaseColors = [C.accent, C.cyan, C.green];
  return (
    <div>
      {phases.map((phase, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: i < phases.length - 1 ? 0 : 0 }}>
          {/* line + dot */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: phaseColors[i] || C.accent,
              flexShrink: 0, marginTop: 3,
              boxShadow: `0 0 0 3px ${phaseColors[i] || C.accent}33`,
            }} />
            {i < phases.length - 1 && (
              <div style={{ flex: 1, width: 2, background: C.border, margin: "4px 0" }} />
            )}
          </div>
          {/* content */}
          <div style={{ paddingBottom: 24, flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: phaseColors[i] || C.accent,
              marginBottom: 2,
            }}>{phase.phase}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              {phase.focus}
            </div>
            {(phase.items || []).map((item, j) => (
              <div key={j} style={{
                fontSize: 12, color: "rgba(255,255,255,0.75)",
                marginBottom: 4,
                display: "flex", gap: 6, alignItems: "flex-start",
              }}>
                <span style={{ color: phaseColors[i], flexShrink: 0 }}>•</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// project suggestion card
// ─────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.accent}`,
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{project.name}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
        {project.description}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {(project.skills || []).map((s, i) => (
          <Badge key={i} label={s} color={C.accent} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// course recommendation card
// ─────────────────────────────────────────────────────────────
function CourseCard({ course }) {
  const matchColor = course.match_score >= 70 ? C.green : course.match_score >= 40 ? C.amber : C.muted;
  return (
    <div style={{
      background: C.surface2, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden",
      transition: ".2s", cursor: "pointer",
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = C.border2}
      onMouseOut={e  => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{
        height: 72, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 30,
        background: `linear-gradient(135deg,${C.accent}18,${C.pink}0a)`,
      }}>🎓</div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{course.title}</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{course.provider}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={course.level} color={C.cyan} />
          <span style={{ fontSize: 11, color: matchColor, fontWeight: 600 }}>
            {course.match_score}% match
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ResumePage() {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Data Scientist");
  const [file, setFile]             = useState(null);
  const [inputMode, setInputMode]   = useState("text"); // "text" | "file"
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);
  const [dragging, setDragging]     = useState(false);
  const resultRef                   = useRef(null);

  // ── submit ────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    setError("");
    if (inputMode === "text" && !resumeText.trim()) {
      setError("Please paste your resume text or switch to file upload.");
      return;
    }
    if (inputMode === "file" && !file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let data;
      if (inputMode === "file") {
        const form = new FormData();
        form.append("file", file);
        form.append("target_role", targetRole);
        const res = await api.post("/resume/analyze-file", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        data = res.data;
      } else {
        const res = await api.post("/resume/analyze-text", {
          resume_text: resumeText,
          target_role: targetRole,
        });
        data = res.data;
      }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Analysis failed. Please check your API key or try again."
      );
    } finally {
      setLoading(false);
    }
  }, [inputMode, resumeText, file, targetRole]);

  const handleReset = () => {
    setResult(null);
    setResumeText("");
    setFile(null);
    setError("");
  };

  // ── derived values ────────────────────────────────────────
  const current    = result?.currentSkills        ?? [];
  const missing    = result?.missingSkills         ?? [];
  const score      = result?.matchScore            ?? 0;
  const role       = result?.roleMatch             ?? targetRole;
  const salary     = result?.salaryRange           ?? "";
  const strengths  = result?.topStrengths          ?? [];
  const projects   = result?.projects              ?? [];
  const roadmap    = result?.roadmap               ?? [];
  const courses    = result?.course_recommendations ?? [];
  const yrsExp     = result?.yearsExperience       ?? null;
  const scoreColor = score >= 70 ? C.green : score >= 45 ? C.amber : C.red;

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 26, fontWeight: 700, marginBottom: 4,
          }}>
            📋 Resume Analysis &amp; Career Intelligence
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            Upload your resume — AI extracts skills, detects gaps and builds your career roadmap
          </p>
        </div>
        {result && (
          <Btn variant="ghost" onClick={handleReset}>↺ Analyse Again</Btn>
        )}
      </div>

      {/* ── INPUT SECTION ───────────────────────────────── */}
      {!result && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16, marginBottom: 20,
        }}>
          {/* LEFT — Input */}
          <Card>
            <SectionTitle>📤 Your Resume</SectionTitle>

            {/* mode toggle */}
            <div style={{
              display: "flex", gap: 4,
              background: C.surface2, borderRadius: 10,
              padding: 4, marginBottom: 16,
            }}>
              {["text", "file"].map(m => (
                <button
                  key={m}
                  onClick={() => setInputMode(m)}
                  style={{
                    flex: 1, padding: "8px 0",
                    border: "none", borderRadius: 8,
                    fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                    cursor: "pointer",
                    background: inputMode === m
                      ? `linear-gradient(135deg,${C.accent},${C.accent2})`
                      : "transparent",
                    color: inputMode === m ? "#fff" : C.muted,
                    transition: ".2s",
                  }}
                >
                  {m === "text" ? "✏️ Paste Text" : "📁 Upload File"}
                </button>
              ))}
            </div>

            {inputMode === "text" ? (
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder={`Paste your full resume here…\n\nExample:\nJohn Doe | john@email.com\n\nSKILLS: Python, SQL, Flask, Docker\n\nEXPERIENCE\nData Analyst at TechCorp (2022–2024)\n- Built dashboards with Plotly\n- Managed PostgreSQL databases`}
                style={{
                  width: "100%", height: 220,
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 14px",
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "inherit", fontSize: 13,
                  resize: "vertical", outline: "none",
                  lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            ) : (
              <div>
                <UploadZone
                  onFile={f => setFile(f)}
                  dragging={dragging}
                  setDragging={setDragging}
                />
                {file && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 10, padding: "10px 14px",
                    background: `${C.green}12`,
                    border: `1px solid ${C.green}33`,
                    borderRadius: 10, fontSize: 13,
                  }}>
                    <span>✅ {file.name}</span>
                    <span
                      style={{ color: C.red, cursor: "pointer", fontSize: 16 }}
                      onClick={() => setFile(null)}
                    >✕</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* RIGHT — Settings */}
          <Card>
            <SectionTitle>🎯 Target Role Settings</SectionTitle>

            <label style={{ fontSize: 13, color: C.muted, display: "block", marginBottom: 6 }}>
              Target Job Role
            </label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 10, color: "rgba(255,255,255,0.9)",
                fontFamily: "inherit", fontSize: 14,
                marginBottom: 20, outline: "none",
              }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* role info cards */}
            <div style={{
              background: `${C.accent}0d`,
              border: `1px solid ${C.accent}33`,
              borderRadius: 12, padding: 14,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                🔑 Key skills for {targetRole}
              </div>
              <div>
                {ROLE_SKILL_HINTS[targetRole]?.map((s, i) => (
                  <Badge key={i} label={s} color={C.accent} />
                ))}
              </div>
            </div>

            <div style={{
              background: C.surface2, borderRadius: 12,
              padding: 14, marginBottom: 20,
              fontSize: 13, color: C.muted, lineHeight: 1.7,
            }}>
              {ROLE_DESCRIPTIONS[targetRole] || ""}
            </div>

            {error && (
              <div style={{
                background: `${C.red}15`,
                border: `1px solid ${C.red}33`,
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: C.red, marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            <Btn
              onClick={handleAnalyze}
              disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "⏳ Analysing…" : "🤖 Analyse with AI"}
            </Btn>
          </Card>
        </div>
      )}

      {/* ── LOADING STATE ───────────────────────────────── */}
      {loading && (
        <Card style={{ marginBottom: 20 }}>
          <Loader text="AI is extracting skills, detecting gaps and building your career roadmap…" />
        </Card>
      )}

      {/* ── RESULTS ─────────────────────────────────────── */}
      {result && (
        <div ref={resultRef}>

          {/* ── HERO SCORE BAR ─────────────────────────── */}
          <Card glow style={{ marginBottom: 16 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 28, alignItems: "center",
            }}>
              <ScoreRing score={score} />

              <div>
                <div style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 20, fontWeight: 700, marginBottom: 4,
                }}>
                  {score >= 70
                    ? "Strong Match 🎉"
                    : score >= 45
                      ? "Partial Match — Keep Growing 💪"
                      : "Gap Identified — Here's Your Plan 🗺️"}
                </div>
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
                  Target role: <strong style={{ color: "rgba(255,255,255,.9)" }}>{role}</strong>
                  {yrsExp ? ` · ${yrsExp} year${yrsExp !== 1 ? "s" : ""} experience detected` : ""}
                  {salary ? ` · Est. ${salary}` : ""}
                </div>

                <div style={{ marginBottom: 8 }}>
                  <ProgressBar value={score} color={scoreColor} height={10} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>{score}% match</span>
                  <span style={{ fontSize: 12, color: C.muted }}>·</span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {current.length} skills found · {missing.length} to learn
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Top Strengths</div>
                {strengths.map((s, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <Badge label={s} color={C.green} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── SKILLS ROW ─────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16, marginBottom: 16,
          }}>
            {/* Current skills */}
            <Card>
              <SectionTitle>✅ Skills You Have</SectionTitle>
              {current.length === 0
                ? <p style={{ color: C.muted, fontSize: 13 }}>No skills detected.</p>
                : (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {current.map((s, i) => (
                      <Badge key={i} label={s} color={C.green} />
                    ))}
                  </div>
                )}
            </Card>

            {/* Missing skills */}
            <Card style={{ borderColor: `${C.red}33` }}>
              <SectionTitle>❌ Skills to Learn</SectionTitle>
              {missing.length === 0
                ? <p style={{ color: C.green, fontSize: 13 }}>🎉 No skill gaps found!</p>
                : (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {missing.map((s, i) => (
                      <Badge key={i} label={s} color={C.red} />
                    ))}
                  </div>
                )}
            </Card>

            {/* Role match panel */}
            <Card style={{ textAlign: "center" }}>
              <SectionTitle>💼 Role Match</SectionTitle>
              <div style={{
                fontSize: 40, marginBottom: 8,
                fontFamily: "Syne, sans-serif", fontWeight: 800,
                color: scoreColor,
              }}>{score}%</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{role}</div>
              {salary && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{salary}</div>
              )}
              <Btn
                style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                onClick={() => window.location.href = "/learning-path"}
              >
                View Full Path →
              </Btn>
            </Card>
          </div>

          {/* ── CHARTS ROW ─────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16, marginBottom: 16,
          }}>
            <Card>
              <SectionTitle>📊 Skill Gap Overview</SectionTitle>
              <SkillGapChart have={current.length} missing={missing.length} />
            </Card>
            <Card>
              <SectionTitle>🕸️ Skill Category Radar</SectionTitle>
              <SkillRadar currentSkills={current} missingSkills={missing} />
            </Card>
          </div>

          {/* ── REQUIRED SKILLS BAR ────────────────────── */}
          {ROLE_SKILL_HINTS[role] && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>🎯 Required Skills vs What You Have — {role}</SectionTitle>
              <SkillBarsChart
                required={ROLE_SKILL_HINTS[role] || []}
                current={current}
              />
            </Card>
          )}

          {/* ── ROADMAP + PROJECTS ─────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16, marginBottom: 16,
          }}>
            <Card>
              <SectionTitle>🗺️ Career Roadmap</SectionTitle>
              {roadmap.length === 0
                ? <p style={{ color: C.muted, fontSize: 13 }}>No roadmap generated.</p>
                : <Roadmap phases={roadmap} />
              }
            </Card>

            <Card>
              <SectionTitle>🚀 Portfolio Projects to Build</SectionTitle>
              {projects.length === 0
                ? <p style={{ color: C.muted, fontSize: 13 }}>No projects suggested.</p>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {projects.map((p, i) => <ProjectCard key={i} project={p} />)}
                  </div>
                )}
            </Card>
          </div>

          {/* ── COURSE RECOMMENDATIONS ─────────────────── */}
          {courses.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>🎓 Recommended Courses for {role}</SectionTitle>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}>
                {courses.map((c, i) => <CourseCard key={i} course={c} />)}
              </div>
            </Card>
          )}

          {/* ── ACTION BAR ─────────────────────────────── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={handleReset}>↺ Re-analyse</Btn>
            <Btn variant="ghost" onClick={() => window.location.href = "/study-plan"}>
              📅 Generate Study Plan
            </Btn>
            <Btn variant="ghost" onClick={() => window.location.href = "/learning-path"}>
              🗺️ View Learning Path
            </Btn>
            <Btn variant="ghost" onClick={() => window.location.href = "/chatbot"}>
              🤖 Ask AI Tutor
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// static role data (used for hints + descriptions in the form)
// ─────────────────────────────────────────────────────────────
const ROLE_SKILL_HINTS = {
  "Data Scientist":        ["Python", "Machine Learning", "Statistics", "Pandas", "SQL", "Data Visualization", "Scikit-learn", "Deep Learning"],
  "ML Engineer":           ["Python", "TensorFlow", "PyTorch", "MLOps", "Docker", "Kubernetes", "Spark", "Airflow"],
  "Web Developer":         ["HTML", "CSS", "JavaScript", "React", "Node.js", "SQL", "REST API", "Git"],
  "Cloud Engineer":        ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Linux", "CI/CD"],
  "DevOps Engineer":       ["Docker", "Kubernetes", "CI/CD", "Linux", "Bash", "Terraform", "AWS", "Git"],
  "Cybersecurity Analyst": ["Linux", "Python", "Networking", "SQL", "Bash", "Penetration Testing"],
  "Product Manager":       ["Agile", "Scrum", "SQL", "Data Analysis", "REST API", "Product Roadmap"],
  "AI Researcher":         ["Python", "PyTorch", "Mathematics", "Deep Learning", "NLP", "Statistics", "Computer Vision"],
};

const ROLE_DESCRIPTIONS = {
  "Data Scientist":        "Focus on statistical modelling, ML algorithms and data storytelling. Strong Python and SQL foundations are essential.",
  "ML Engineer":           "Bridge the gap between research and production. You need solid software engineering skills plus deep ML knowledge.",
  "Web Developer":         "Build user-facing products. Full-stack knowledge with modern JS frameworks and backend APIs is highly valued.",
  "Cloud Engineer":        "Design and maintain scalable cloud infrastructure. Multi-cloud experience and IaC tools like Terraform are key.",
  "DevOps Engineer":       "Automate, monitor and ship software reliably. CI/CD pipelines, containerisation and observability are core.",
  "Cybersecurity Analyst": "Protect systems and data. Threat modelling, penetration testing and incident response are top priorities.",
  "Product Manager":       "Define what to build and why. Data-driven decision making with stakeholder communication skills.",
  "AI Researcher":         "Push the boundaries of AI. Strong mathematical foundations (linear algebra, probability) and research experience needed.",
};
