import { useState, useEffect, useRef } from "react";
import { PageWrapper, PageHeader, Card } from "../components/common/PageWrapper";

const MODES = { focus:25*60, short:5*60, long:15*60 };

export default function TimerPage() {
  const [mode, setMode]       = useState("focus");
  const [seconds, setSeconds] = useState(MODES.focus);
  const [running, setRunning] = useState(false);
  const [pomodoros, setPomodoros] = useState(0);
  const [focusMins, setFocusMins] = useState(0);
  const [breaks, setBreaks]   = useState(0);
  const [task, setTask]       = useState("");
  const [durations, setDurations] = useState({ focus:25, short:5, long:15 });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") {
              setPomodoros(p => p+1);
              setFocusMins(p => p + durations.focus);
              setMode("short");
              setSeconds(durations.short * 60);
            } else {
              setBreaks(p => p+1);
              setMode("focus");
              setSeconds(durations.focus * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, durations]);

  const switchMode = (m) => {
    clearInterval(intervalRef.current);
    setRunning(false); setMode(m);
    setSeconds(durations[m] * 60);
  };

  const toggle = () => setRunning(p => !p);
  const reset  = () => { clearInterval(intervalRef.current); setRunning(false); setSeconds(durations[mode]*60); };
  const skip   = () => { clearInterval(intervalRef.current); setRunning(false); setSeconds(0); };

  const total = durations[mode] * 60;
  const pct   = seconds / total;
  const r     = 90; const circ = 2*Math.PI*r;
  const offset = circ * (1 - pct);
  const mm = String(Math.floor(seconds/60)).padStart(2,"0");
  const ss = String(seconds%60).padStart(2,"0");

  const modeColors = { focus:"var(--accent)", short:"var(--green)", long:"var(--cyan)" };
  const modeLabels = { focus:"Focus Time 🎯", short:"Short Break ☕", long:"Long Break 🛋️" };

  return (
    <PageWrapper>
      <PageHeader title="⏱️ Pomodoro Study Timer" subtitle="Scientifically-proven focus technique for maximum productivity" />
      <div style={{ maxWidth:440, margin:"0 auto" }}>
        <Card style={{ textAlign:"center", padding:32 }}>
          {/* Mode Selector */}
          <div style={{ display:"flex", gap:4, background:"var(--surface2)", borderRadius:10, padding:4, marginBottom:28 }}>
            {Object.entries({ focus:"🎯 Focus", short:"☕ Short Break", long:"🛋️ Long Break" }).map(([key,label]) => (
              <button key={key} onClick={() => switchMode(key)} style={{
                flex:1, padding:"8px 4px", border:"none", borderRadius:8, fontFamily:"inherit", fontSize:12,
                fontWeight:500, cursor:"pointer", transition:".2s",
                background: mode===key ? modeColors[key] : "transparent",
                color: mode===key ? "#fff" : "var(--text2)",
              }}>{label}</button>
            ))}
          </div>

          {/* Ring */}
          <div style={{ position:"relative", width:220, height:220, margin:"0 auto 24px" }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--pink)" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r={r} fill="none" stroke="var(--surface2)" strokeWidth="10" />
              <circle cx="110" cy="110" r={r} fill="none"
                stroke={mode==="focus"?"url(#tg)":modeColors[mode]}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                transform="rotate(-90 110 110)"
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
              />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:46, fontWeight:700, lineHeight:1 }}>{mm}:{ss}</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:6 }}>{modeLabels[mode]}</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:20 }}>
            <button onClick={reset} style={{ padding:"10px 18px", background:"transparent", border:"1px solid var(--border2)", borderRadius:10, color:"var(--text2)", fontFamily:"inherit", fontSize:14, cursor:"pointer" }}>↺ Reset</button>
            <button onClick={toggle} style={{ padding:"10px 28px", background:`linear-gradient(135deg,var(--accent),var(--accent2))`, border:"none", borderRadius:10, color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:600, cursor:"pointer", minWidth:120 }}>
              {running ? "⏸ Pause" : "▶ Start"}
            </button>
            <button onClick={skip} style={{ padding:"10px 18px", background:"transparent", border:"1px solid var(--border2)", borderRadius:10, color:"var(--text2)", fontFamily:"inherit", fontSize:14, cursor:"pointer" }}>Skip ⏭</button>
          </div>

          {/* Task */}
          <input value={task} onChange={e=>setTask(e.target.value)} placeholder="What are you working on?" style={{ textAlign:"center" }} />
        </Card>

        {/* Stats */}
        <Card style={{ marginTop:14 }}>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:600, marginBottom:14 }}>📊 Today's Sessions</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", textAlign:"center", gap:8 }}>
            {[["🍅","Pomodoros",pomodoros,"var(--accent)"],["⏱️","Focus Mins",focusMins,"var(--cyan)"],["☕","Breaks",breaks,"var(--green)"]].map(([icon,label,val,color]) => (
              <div key={label} style={{ background:"var(--surface2)", borderRadius:10, padding:"14px 8px" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:11, color:"var(--text2)" }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Settings */}
        <Card style={{ marginTop:14 }}>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:600, marginBottom:14 }}>⚙️ Timer Settings</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[["focus","Focus (min)"],["short","Short Break"],["long","Long Break"]].map(([key,label]) => (
              <div key={key}>
                <label style={{ fontSize:12, color:"var(--text2)", display:"block", marginBottom:4 }}>{label}</label>
                <input type="number" min={1} max={90} value={durations[key]}
                  onChange={e => { const v=parseInt(e.target.value)||1; setDurations(p=>({...p,[key]:v})); if(mode===key&&!running) setSeconds(v*60); }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
