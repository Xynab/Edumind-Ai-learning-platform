export function PageWrapper({ children }) {
  return (
    <div style={{ padding: 32, maxWidth: 1200, animation: "fadeIn .3s ease" }}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text2)", fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${glow ? "rgba(124,106,247,0.3)" : "var(--border)"}`,
      borderRadius: 16, padding: 20,
      ...(glow ? { boxShadow: "0 0 24px rgba(124,106,247,0.08)" } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardGrid({ cols = 2, children, style = {} }) {
  const tpl = { 1:"1fr", 2:"repeat(2,1fr)", 3:"repeat(3,1fr)", 4:"repeat(4,1fr)" }[cols] || `repeat(${cols},1fr)`;
  return <div style={{ display: "grid", gridTemplateColumns: tpl, gap: 16, ...style }}>{children}</div>;
}

export function StatCard({ label, value, sub, color = "var(--accent)", icon }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-28, right:-28, width:90, height:90, background:`${color}18`, borderRadius:"50%" }} />
      {icon && <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>}
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:"var(--text2)" }}>{label}</div>
      {sub && <div style={{ fontSize:12, marginTop:6, color: sub.startsWith("+") ? "var(--green)" : sub.startsWith("-") ? "var(--red)" : "var(--text2)" }}>{sub}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant="primary", disabled=false, style={}, size="md" }) {
  const pad = size === "sm" ? "7px 13px" : "10px 20px";
  const fs  = size === "sm" ? 13 : 14;
  const variants = {
    primary: { background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"#fff", border:"none" },
    ghost:   { background:"transparent", color:"var(--text2)", border:"1px solid var(--border2)" },
    danger:  { background:"rgba(248,113,113,0.12)", color:"var(--red)", border:"1px solid rgba(248,113,113,0.25)" },
    success: { background:"rgba(74,222,128,0.12)", color:"var(--green)", border:"1px solid rgba(74,222,128,0.25)" },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:8, padding:pad, borderRadius:10,
               fontFamily:"inherit", fontSize:fs, fontWeight:500, cursor:disabled?"not-allowed":"pointer",
               opacity:disabled?0.6:1, transition:".2s", ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Badge({ label, color = "var(--accent)", bg }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20,
                   fontSize:12, fontWeight:500, background: bg || `${color}22`, color }}>
      {label}
    </span>
  );
}

export function ProgressBar({ value, color = "var(--accent)", height = 6 }) {
  return (
    <div style={{ height, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(Math.max(value,0),100)}%`,
                    background:color, borderRadius:99, transition:"width .6s ease" }} />
    </div>
  );
}

export function Loader({ text = "Loading…" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(124,106,247,0.2)",
                      borderTop:"3px solid var(--accent)", borderRadius:"50%",
                      animation:"spin .8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"var(--text2)", fontSize:14 }}>{text}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon="📭", title="No Data Yet", desc="", action }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--surface)",
                  borderRadius:16, border:"1px solid var(--border)" }}>
      <div style={{ fontSize:52, marginBottom:14 }}>{icon}</div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:600, marginBottom:8 }}>{title}</div>
      {desc && <p style={{ color:"var(--text2)", fontSize:14, maxWidth:380, margin:"0 auto 20px" }}>{desc}</p>}
      {action}
    </div>
  );
}

export function SectionTitle({ children }) {
  return <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>{children}</div>;
}
