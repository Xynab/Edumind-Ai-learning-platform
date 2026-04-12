import { useEffect, useState } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, Btn, Loader, EmptyState, SectionTitle } from "../components/common/PageWrapper";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({ subject:"", topic:"", remind_at:"", frequency:"weekly", priority:"medium" });
  const [error, setError] = useState("");

  const load = () => api.get("/reminders/").then(r => setReminders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.subject || !form.topic || !form.remind_at) { setError("Fill in all required fields."); return; }
    setError("");
    await api.post("/reminders/", form);
    setForm({ subject:"", topic:"", remind_at:"", frequency:"weekly", priority:"medium" });
    load();
  };

  const toggle = async (id) => { await api.patch(`/reminders/${id}/toggle`); load(); };
  const del    = async (id) => { await api.delete(`/reminders/${id}`); setReminders(p => p.filter(r => r.id !== id)); };

  const prioColor = { High:"var(--red)", Medium:"var(--amber)", Low:"var(--green)" };
  const f = k => ({ value:form[k], onChange:e=>setForm(p=>({...p,[k]:e.target.value})) });

  if (loading) return <Loader text="Loading reminders…" />;

  return (
    <PageWrapper>
      <PageHeader title="🔔 Revision Reminders" subtitle="Spaced repetition reminders to keep your knowledge fresh" />

      <Card style={{ marginBottom:20 }}>
        <SectionTitle>➕ Add Reminder</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:12 }}>
          <div><label style={{ fontSize:13, color:"var(--text2)", display:"block", marginBottom:5 }}>Subject *</label><input {...f("subject")} placeholder="e.g. Machine Learning" /></div>
          <div><label style={{ fontSize:13, color:"var(--text2)", display:"block", marginBottom:5 }}>Topic *</label><input {...f("topic")} placeholder="e.g. Gradient Descent" /></div>
          <div><label style={{ fontSize:13, color:"var(--text2)", display:"block", marginBottom:5 }}>Remind Date *</label><input type="datetime-local" {...f("remind_at")} /></div>
          <div><label style={{ fontSize:13, color:"var(--text2)", display:"block", marginBottom:5 }}>Frequency</label>
            <select {...f("frequency")}><option value="once">Once</option><option value="daily">Daily</option><option value="every_3_days">Every 3 Days</option><option value="weekly">Weekly</option><option value="spaced">Spaced Repetition</option></select></div>
          <div><label style={{ fontSize:13, color:"var(--text2)", display:"block", marginBottom:5 }}>Priority</label>
            <select {...f("priority")}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
        </div>
        {error && <div style={{ color:"var(--red)", fontSize:13, marginBottom:10 }}>⚠️ {error}</div>}
        <Btn onClick={add}>+ Add Reminder</Btn>
      </Card>

      {reminders.length === 0
        ? <EmptyState icon="🔔" title="No Reminders Yet" desc="Set spaced repetition reminders so you never forget what you learned." />
        : (
          <Card>
            <SectionTitle>📋 Active Reminders ({reminders.length})</SectionTitle>
            {reminders.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                                        padding:"12px 14px", background:"var(--surface2)", border:"1px solid var(--border)",
                                        borderRadius:10, marginBottom:10, opacity:r.is_active?1:0.5 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{r.subject} — {r.topic}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                    📅 {r.remind_at?.slice(0,16).replace("T"," ")} · {r.frequency}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:20,
                                  background:`${prioColor[r.priority]||"var(--amber)"}22`,
                                  color:prioColor[r.priority]||"var(--amber)" }}>{r.priority}</span>
                  <Btn size="sm" variant="ghost" onClick={() => toggle(r.id)}>{r.is_active?"⏸":"▶"}</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(r.id)}>🗑</Btn>
                </div>
              </div>
            ))}
          </Card>
        )
      }
    </PageWrapper>
  );
}
