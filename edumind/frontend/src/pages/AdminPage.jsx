import { useEffect, useState } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, CardGrid, StatCard, Btn, Loader, SectionTitle } from "../components/common/PageWrapper";

export default function AdminPage() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [notes, setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState("users");

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/admin/notes"),
    ]).then(([s,u,n]) => { setStats(s.data); setUsers(u.data); setNotes(n.data); })
      .finally(() => setLoading(false));
  }, []);

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(p => p.filter(u => u.id !== id));
  };

  const deleteNote = async (id) => {
    await api.delete(`/admin/notes/${id}`);
    setNotes(p => p.filter(n => n.id !== id));
  };

  if (loading) return <Loader text="Loading admin panel…" />;

  const tabs = ["users","notes"];

  return (
    <PageWrapper>
      <PageHeader title="⚙️ Admin Panel" subtitle="Manage users, content and platform analytics" />

      <CardGrid cols={4} style={{ marginBottom:20 }}>
        <StatCard label="Total Users"    value={stats?.total_users  ?? 0} color="var(--accent)" icon="👥" />
        <StatCard label="Notes Uploaded" value={stats?.total_notes  ?? 0} color="var(--cyan)"   icon="📄" />
        <StatCard label="Quizzes Taken"  value={stats?.total_quizzes?? 0} color="var(--green)"  icon="🧠" />
        <StatCard label="Flashcards"     value={stats?.total_cards  ?? 0} color="var(--amber)"  icon="🃏" />
      </CardGrid>

      <div style={{ display:"flex", gap:4, borderBottom:"1px solid var(--border)", marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"10px 20px", background:"transparent", border:"none",
            borderBottom:`2px solid ${tab===t?"var(--accent)":"transparent"}`,
            color:tab===t?"var(--accent)":"var(--text2)", fontFamily:"inherit", fontSize:14,
            fontWeight:500, cursor:"pointer", marginBottom:-1, textTransform:"capitalize"
          }}>{t}</button>
        ))}
      </div>

      {tab === "users" && (
        <Card>
          <SectionTitle>👥 All Users ({users.length})</SectionTitle>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              {["Name","Email","Role","Plan","Joined","Actions"].map(h => (
                <th key={h} style={{ textAlign:"left", fontSize:12, textTransform:"uppercase", letterSpacing:".05em", color:"var(--text3)", padding:"8px 12px", borderBottom:"1px solid var(--border)" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={td}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,var(--accent),var(--cyan))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight:500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color:"var(--text2)", fontSize:13 }}>{u.email}</td>
                  <td style={td}><span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:u.role==="admin"?"rgba(248,113,113,0.12)":"rgba(124,106,247,0.12)", color:u.role==="admin"?"var(--red)":"var(--accent)" }}>{u.role}</span></td>
                  <td style={td}><span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:u.plan==="pro"?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.06)", color:u.plan==="pro"?"var(--amber)":"var(--text2)" }}>{u.plan}</span></td>
                  <td style={{ ...td, color:"var(--text2)", fontSize:13 }}>{u.created_at?.slice(0,10)}</td>
                  <td style={td}><Btn size="sm" variant="danger" onClick={() => deleteUser(u.id)}>🗑 Delete</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "notes" && (
        <Card>
          <SectionTitle>📄 All Notes ({notes.length})</SectionTitle>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              {["Title","Subject","Size","Date","Actions"].map(h => (
                <th key={h} style={{ textAlign:"left", fontSize:12, textTransform:"uppercase", letterSpacing:".05em", color:"var(--text3)", padding:"8px 12px", borderBottom:"1px solid var(--border)" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id}>
                  <td style={td}><span style={{ fontWeight:500 }}>{n.title}</span></td>
                  <td style={td}><span style={{ fontSize:11, background:"rgba(124,106,247,0.12)", color:"var(--accent)", padding:"3px 9px", borderRadius:20 }}>{n.subject}</span></td>
                  <td style={{ ...td, color:"var(--text2)", fontSize:13 }}>{n.file_size_mb} MB</td>
                  <td style={{ ...td, color:"var(--text2)", fontSize:13 }}>{n.created_at?.slice(0,10)}</td>
                  <td style={td}><Btn size="sm" variant="danger" onClick={() => deleteNote(n.id)}>🗑</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PageWrapper>
  );
}

const td = { padding:"11px 12px", borderBottom:"1px solid var(--border)", fontSize:14 };
