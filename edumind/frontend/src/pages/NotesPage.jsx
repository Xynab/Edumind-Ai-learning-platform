import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, Btn, Loader, EmptyState, SectionTitle } from "../components/common/PageWrapper";

const TYPE_ICONS = { pdf: "📄", txt: "📝", docx: "📃", md: "📋" };
const SUBJ_COLORS = {
  "Machine Learning": "var(--accent)",
  "Databases": "var(--cyan)",
  "Statistics": "var(--amber)",
  "Programming": "var(--green)",
  "General": "var(--text2)",
};

export default function NotesPage() {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject]     = useState("General");
  const [summary, setSummary]     = useState(null);
  const [sumLoading, setSumLoading] = useState(false);
  const [error, setError]         = useState("");
  const fileRef = useRef();

  const load = () =>
    api.get("/notes/")
      .then(r => setNotes(r.data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("subject", subject);
    try {
      await api.post("/notes/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      fileRef.current.value = "";
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (summary?.noteId === id) setSummary(null);
  };

  const handleSummarize = async (note) => {
    setSumLoading(true);
    setSummary(null);
    try {
      const res = await api.post(`/summarize/note/${note.id}`);
      setSummary({ ...res.data, noteId: note.id, title: note.title });
      await load();
    } catch (err) {
      setSummary({ error: true, message: err.response?.data?.detail || "Summarization failed" });
    } finally {
      setSumLoading(false);
    }
  };

  if (loading) return <Loader text="Loading notes…" />;

  return (
    <PageWrapper>
      <PageHeader
        title="📄 My Notes"
        subtitle="Upload study materials and get AI-powered summaries"
        action={
          <Btn onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "+ Upload Note"}
          </Btn>
        }
      />

      {/* Upload zone */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-end",
          flexWrap: "wrap", marginBottom: 12,
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{
              fontSize: 13, color: "var(--text2)",
              display: "block", marginBottom: 5,
            }}>
              Subject
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Machine Learning"
            />
          </div>
          <Btn onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? "⏳ Uploading…" : "📤 Choose File"}
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.docx,.md"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onDragLeave={e => {
            e.currentTarget.style.borderColor = "var(--border2)";
          }}
          onDrop={async e => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "var(--border2)";
            const f = e.dataTransfer.files[0];
            if (f) {
              const dt = new DataTransfer();
              dt.items.add(f);
              fileRef.current.files = dt.files;
              handleUpload({ target: { files: dt.files } });
            }
          }}
          style={{
            border: "2px dashed var(--border2)", borderRadius: 12,
            padding: "32px 20px", textAlign: "center",
            cursor: "pointer", transition: ".2s",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 8 }}>📤</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            Drop files here or click to upload
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>
            PDF, DOCX, TXT, MD · Max 50 MB
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 10, color: "var(--red)", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
      </Card>

      {/* Notes list */}
      {notes.length === 0
        ? (
          <EmptyState
            icon="📄"
            title="No Notes Yet"
            desc="Upload your first PDF, DOCX or text file to get started."
            action={<Btn onClick={() => fileRef.current.click()}>Upload First Note</Btn>}
          />
        )
        : (
          <Card style={{ marginBottom: 20 }}>
            <SectionTitle>All Notes ({notes.length})</SectionTitle>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Title", "Subject", "Size", "Date", "Actions"].map(h => (
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
                {notes.map(n => (
                  <tr key={n.id}>
                    <td style={td}>
                      <span style={{ marginRight: 8 }}>
                        {TYPE_ICONS[n.file_type] || "📄"}
                      </span>
                      <span style={{ fontWeight: 500 }}>{n.title}</span>
                      {n.is_summarized && (
                        <span style={{
                          marginLeft: 8, fontSize: 11,
                          background: "rgba(74,222,128,0.12)",
                          color: "var(--green)",
                          padding: "2px 7px", borderRadius: 20,
                        }}>
                          Summarised
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{
                        fontSize: 12,
                        background: "rgba(124,106,247,0.12)",
                        color: SUBJ_COLORS[n.subject] || "var(--accent)",
                        padding: "3px 9px", borderRadius: 20,
                      }}>
                        {n.subject}
                      </span>
                    </td>
                    <td style={{ ...td, color: "var(--text2)", fontSize: 13 }}>
                      {n.file_size_mb} MB
                    </td>
                    <td style={{ ...td, color: "var(--text2)", fontSize: 13 }}>
                      {n.created_at?.slice(0, 10)}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSummarize(n)}
                          disabled={sumLoading}
                        >
                          ✨ Summarise
                        </Btn>
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(n.id)}
                        >
                          🗑
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      }

      {/* Summary panel */}
      {(sumLoading || summary) && (
        <Card glow>
          <SectionTitle>
            ✨ AI Summary{summary?.title ? ` — ${summary.title}` : ""}
          </SectionTitle>

          {sumLoading
            ? (
              <div style={{ display: "flex", gap: 5, padding: "8px 0" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--accent)",
                    animation: "bounce .8s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
                <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-6px);opacity:1}}`}</style>
              </div>
            )
            : summary?.error
              ? (
                <p style={{ color: "var(--red)" }}>
                  ⚠️ {summary.message || "Failed to summarise. Please try again."}
                </p>
              )
              : (
                <>
                  {/* Summary text */}
                  {summary.summary && (
                    <p style={{
                      fontSize: 14, lineHeight: 1.8,
                      color: "var(--text2)", marginBottom: 16,
                    }}>
                      {summary.summary}
                    </p>
                  )}

                  {/* Key concepts */}
                  {summary.key_concepts?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 8,
                      }}>
                        🔑 Key Concepts
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {summary.key_concepts.map((k, i) => (
                          <span key={i} style={{
                            fontSize: 12,
                            background: "rgba(124,106,247,0.12)",
                            color: "var(--accent)",
                            padding: "4px 11px", borderRadius: 20,
                          }}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study tips */}
                  {summary.study_tips?.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 8,
                      }}>
                        💡 Study Tips
                      </div>
                      {summary.study_tips.map((t, i) => (
                        <div key={i} style={{
                          fontSize: 13, color: "var(--text2)", marginBottom: 4,
                        }}>
                          • {t}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
          }
        </Card>
      )}
    </PageWrapper>
  );
}

const td = {
  padding: "11px 12px",
  borderBottom: "1px solid var(--border)",
  fontSize: 14,
};