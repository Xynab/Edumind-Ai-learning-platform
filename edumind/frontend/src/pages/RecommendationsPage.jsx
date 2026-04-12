import { useEffect, useState } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, CardGrid, Loader, SectionTitle } from "../components/common/PageWrapper";

function getCourseEmoji(title) {
  const t = title.toLowerCase();
  if (t.includes("machine learning") || t.includes("ml specialization")) return "🤖";
  if (t.includes("deep learning")) return "🧠";
  if (t.includes("python")) return "🐍";
  if (t.includes("sql") || t.includes("database")) return "🗄️";
  if (t.includes("react") || t.includes("web")) return "🌐";
  if (t.includes("statistics") || t.includes("stats")) return "📊";
  if (t.includes("cloud") || t.includes("aws") || t.includes("mlops")) return "☁️";
  if (t.includes("data science") || t.includes("data")) return "📈";
  return "🎓";
}

function CourseCard({ c }) {
  const col = c.match_score >= 70
    ? "var(--green)"
    : c.match_score >= 40
      ? "var(--amber)"
      : "var(--text2)";

  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
        cursor: "pointer", transition: ".15s",
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = "var(--border2)"}
      onMouseOut={e  => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* Thumbnail — emoji derived from title */}
      <div style={{
        height: 72, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 32,
        background: "linear-gradient(135deg,rgba(124,106,247,0.12),rgba(244,114,182,0.06))",
      }}>
        {getCourseEmoji(c.title || "")}
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>
          {c.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
          {c.provider} · {c.level}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontSize: 11,
            background: "rgba(34,211,238,0.12)",
            color: "var(--cyan)",
            padding: "2px 8px", borderRadius: 20,
          }}>
            {c.level}
          </span>
          <span style={{ fontSize: 11, color: col, fontWeight: 600 }}>
            {c.match_score}% match
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("courses");

  useEffect(() => {
    api.get("/recommendations/")
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading recommendations…" />;

  const tabs = [
    { id: "courses",  label: "🎓 Courses"  },
    { id: "books",    label: "📚 Books"    },
    { id: "projects", label: "🚀 Projects" },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="⭐ Course Recommendations"
        subtitle="AI-curated resources personalised to your weak topics and learning goals"
      />

      {/* AI engine banner */}
      <Card style={{
        marginBottom: 20,
        background: "linear-gradient(135deg,rgba(124,106,247,0.08),transparent)",
        border: "1px solid rgba(124,106,247,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              AI Recommendation Engine Active
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              Personalised based on your weak topics and quiz performance
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4,
        borderBottom: "1px solid var(--border)",
        marginBottom: 20,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              background: "transparent", border: "none",
              borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
              color: tab === t.id ? "var(--accent)" : "var(--text2)",
              fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              cursor: "pointer", marginBottom: -1, transition: ".15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {tab === "courses" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 12,
        }}>
          {(data?.courses || []).map((c, i) => (
            <CourseCard key={i} c={c} />
          ))}
        </div>
      )}

      {/* Books tab */}
      {tab === "books" && (
        <CardGrid cols={2}>
          {(data?.books || []).map((b, i) => (
            <Card key={i}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 36 }}>{b.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {b.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: "var(--text2)", marginBottom: 6,
                  }}>
                    {b.author}
                  </div>
                  <span style={{
                    fontSize: 11,
                    background: "rgba(74,222,128,0.12)",
                    color: "var(--green)",
                    padding: "3px 9px", borderRadius: 20,
                  }}>
                    {b.match} match
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}

      {/* Projects tab */}
      {tab === "projects" && (
        <CardGrid cols={2}>
          {(data?.projects || []).map((p, i) => (
            <Card key={i} style={{ borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {p.title}
              </div>
              <div style={{
                fontSize: 13, color: "var(--text2)",
                lineHeight: 1.6, marginBottom: 10,
              }}>
                {p.desc}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.skills.map((s, j) => (
                  <span key={j} style={{
                    fontSize: 11,
                    background: "rgba(124,106,247,0.12)",
                    color: "var(--accent)",
                    padding: "3px 9px", borderRadius: 20,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </CardGrid>
      )}
    </PageWrapper>
  );
}