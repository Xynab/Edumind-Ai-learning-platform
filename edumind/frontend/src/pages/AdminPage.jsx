import { useEffect, useState } from "react";
import api from "../services/api";
import {
  PageWrapper, PageHeader, Card, CardGrid,
  StatCard, Btn, Loader, SectionTitle,
} from "../components/common/PageWrapper";

export default function AdminPage() {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [notes, setNotes]     = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("users");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/admin/notes"),
    ]).then(([s, u, n]) => {
      setStats(s.data);
      setUsers(u.data);
      setNotes(n.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their data?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
    } catch {
      alert("Failed to delete user.");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.delete(`/admin/notes/${id}`);
      setNotes(p => p.filter(n => n.id !== id));
    } catch {
      alert("Failed to delete note.");
    }
  };

  if (loading) return <Loader text="Loading admin panel…" />;

  const tabs = [
    { id: "users",   label: "👥 Users" },
    { id: "notes",   label: "📄 Notes" },
    { id: "overview", label: "📊 Overview" },
  ];

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotes = notes.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <PageHeader
        title="⚙️ Admin Panel"
        subtitle="Manage users, content and platform analytics"
      />

      {/* Stats row */}
      <CardGrid cols={4} style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="var(--accent)" icon="👥"
        />
        <StatCard
          label="Notes Uploaded"
          value={stats?.total_notes ?? 0}
          color="var(--cyan)" icon="📄"
        />
        <StatCard
          label="Quizzes Taken"
          value={stats?.total_quizzes ?? 0}
          color="var(--green)" icon="🧠"
        />
        <StatCard
          label="Flashcards"
          value={stats?.total_cards ?? 0}
          color="var(--amber)" icon="🃏"
        />
      </CardGrid>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tab}…`}
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4,
        borderBottom: "1px solid var(--border)",
        marginBottom: 20,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); }}
            style={{
              padding: "10px 20px", background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
              color: tab === t.id ? "var(--accent)" : "var(--text2)",
              fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              cursor: "pointer", marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <Card>
          <SectionTitle>
            👥 All Users ({filteredUsers.length}
            {search ? ` of ${users.length}` : ""})
          </SectionTitle>
          {filteredUsers.length === 0
            ? (
              <p style={{ color: "var(--text2)", fontSize: 14, padding: "20px 0" }}>
                {search ? "No users match your search." : "No users registered yet."}
              </p>
            )
            : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name", "Email", "Role", "Goal", "Joined", "Actions"].map(h => (
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
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg,var(--accent),var(--cyan))",
                            display: "flex", alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "#fff",
                            flexShrink: 0,
                          }}>
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ ...td, color: "var(--text2)", fontSize: 13 }}>
                        {u.email}
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 20,
                          background: u.role === "admin"
                            ? "rgba(248,113,113,0.12)"
                            : "rgba(124,106,247,0.12)",
                          color: u.role === "admin" ? "var(--red)" : "var(--accent)",
                        }}>
                          {u.role || "learner"}
                        </span>
                      </td>
                      <td style={{ ...td, color: "var(--text2)", fontSize: 13 }}>
                        {u.goal || "—"}
                      </td>
                      <td style={{ ...td, color: "var(--text2)", fontSize: 13 }}>
                        {u.created_at?.slice(0, 10) || "—"}
                      </td>
                      <td style={td}>
                        {u.role !== "admin" && (
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => deleteUser(u.id)}
                          >
                            🗑 Delete
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <Card>
          <SectionTitle>
            📄 All Notes ({filteredNotes.length}
            {search ? ` of ${notes.length}` : ""})
          </SectionTitle>
          {filteredNotes.length === 0
            ? (
              <p style={{ color: "var(--text2)", fontSize: 14, padding: "20px 0" }}>
                {search ? "No notes match your search." : "No notes uploaded yet."}
              </p>
            )
            : (
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
                  {filteredNotes.map(n => (
                    <tr key={n.id}>
                      <td style={td}>
                        <span style={{ fontWeight: 500 }}>{n.title}</span>
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 20,
                          background: "rgba(124,106,247,0.12)", color: "var(--accent)",
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
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => deleteNote(n.id)}
                        >
                          🗑
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      )}

      {/* Overview tab */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionTitle>📊 Platform Overview</SectionTitle>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}>
              {[
                { label: "Total Users", value: stats?.total_users ?? 0, icon: "👥", color: "var(--accent)" },
                { label: "Total Notes", value: stats?.total_notes ?? 0, icon: "📄", color: "var(--cyan)" },
                { label: "Total Quizzes", value: stats?.total_quizzes ?? 0, icon: "🧠", color: "var(--green)" },
                { label: "Total Flashcards", value: stats?.total_cards ?? 0, icon: "🃏", color: "var(--amber)" },
                { label: "Avg Quizzes per User", value: users.length > 0 ? Math.round((stats?.total_quizzes ?? 0) / users.length) : 0, icon: "📈", color: "var(--pink)" },
                { label: "Avg Notes per User", value: users.length > 0 ? Math.round((stats?.total_notes ?? 0) / users.length) : 0, icon: "📝", color: "var(--purple)" },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{ fontSize: 28 }}>{item.icon}</div>
                  <div>
                    <div style={{
                      fontFamily: "Syne,sans-serif",
                      fontSize: 24, fontWeight: 700, color: item.color,
                    }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>👥 Recent Users</SectionTitle>
            {users.slice(0, 5).map((u, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < 4 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--accent),var(--cyan))",
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700, fontSize: 14, color: "#fff",
                  }}>
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {u.created_at?.slice(0, 10) || "—"}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}

const td = {
  padding: "11px 12px",
  borderBottom: "1px solid var(--border)",
  fontSize: 14,
};