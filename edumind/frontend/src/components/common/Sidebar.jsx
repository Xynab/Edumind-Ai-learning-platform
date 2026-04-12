import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { section: "Main", items: [
    { to: "/",             icon: "🏠", label: "Dashboard" },
    { to: "/chatbot",      icon: "🤖", label: "AI Tutor",     badge: "AI" },
    { to: "/notes",        icon: "📄", label: "My Notes" },
    { to: "/quiz",         icon: "🧠", label: "Quizzes" },
  ]},
  { section: "Analytics", items: [
    { to: "/performance",  icon: "📊", label: "Performance" },
    { to: "/progress",     icon: "📈", label: "Progress" },
    { to: "/weak-topics",  icon: "🎯", label: "Weak Topics" },
  ]},
  { section: "Career", items: [
    { to: "/resume",        icon: "📋", label: "Resume AI",    badge: "NEW" },
    { to: "/learning-path", icon: "🗺️", label: "Learning Path" },
    { to: "/study-plan",    icon: "📅", label: "Study Plan" },
    { to: "/recommendations",icon:"⭐", label: "Courses" },
  ]},
  { section: "Tools", items: [
    { to: "/flashcards",   icon: "🃏", label: "Flashcards" },
    { to: "/timer",        icon: "⏱️", label: "Timer" },
    { to: "/reminders",    icon: "🔔", label: "Reminders" },
  ]},
];

const s = {
  sidebar: { width: 240, minWidth: 240, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" },
  logo: { padding: "22px 18px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" },
  logoIcon: { width: 34, height: 34, background: "linear-gradient(135deg,#7c6af7,#f472b6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0 },
  logoText: { fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, background: "linear-gradient(90deg,#7c6af7,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  logoSub: { fontSize: 10, color: "var(--text3)", letterSpacing: ".05em", textTransform: "uppercase" },
  section: { padding: "10px 0 2px" },
  sectionLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text3)", padding: "6px 18px 3px" },
  item: { display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", cursor: "pointer", color: "var(--text2)", fontSize: 14, fontWeight: 500, borderLeft: "3px solid transparent", textDecoration: "none", transition: ".15s" },
  badge: { marginLeft: "auto", background: "var(--accent)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600 },
  userSection: { marginTop: "auto", padding: 14, borderTop: "1px solid var(--border)" },
  userCard: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface)", borderRadius: 10, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c6af7,#22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 },
  logoutBtn: { width: "100%", padding: "8px 0", background: "transparent", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text2)", fontSize: 13, cursor: "pointer", transition: ".15s" },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const activeStyle = {
    background: "rgba(124,106,247,0.12)",
    color: "var(--accent)",
    borderLeft: "3px solid var(--accent)",
  };

  const hoverStyle = {
    background: "rgba(124,106,247,0.06)",
    color: "var(--text)",
  };

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoIcon}>E</div>
        <div>
          <div style={s.logoText}>EduMind AI</div>
          <div style={s.logoSub}>Learning Platform</div>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map(sec => (
          <div key={sec.section} style={s.section}>
            <div style={s.sectionLabel}>{sec.section}</div>
            {sec.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                style={({ isActive }) => ({ ...s.item, ...(isActive ? activeStyle : {}) })}
                onMouseOver={e => { if (!e.currentTarget.classList.contains("active")) Object.assign(e.currentTarget.style, hoverStyle); }}
                onMouseOut={e  => { if (!e.currentTarget.classList.contains("active")) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text2)"; }}}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span style={s.badge}>{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {user?.role === "admin" && (
          <div style={s.section}>
            <div style={s.sectionLabel}>Admin</div>
            <NavLink to="/admin" style={({ isActive }) => ({ ...s.item, ...(isActive ? activeStyle : {}) })}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>⚙️</span>
              <span>Admin Panel</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div style={s.userSection}>
        <div style={s.userCard}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{user?.role === "admin" ? "Administrator" : "Learner"}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}
          onMouseOver={e => { e.target.style.background="var(--surface2)"; e.target.style.color="var(--text)"; }}
          onMouseOut={e  => { e.target.style.background="transparent"; e.target.style.color="var(--text2)"; }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}