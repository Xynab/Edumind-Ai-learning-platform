import { useEffect, useState } from "react";
import api from "../services/api";

export default function FlashcardsPage() {
  const [cards, setCards]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic]           = useState("");
  const [numCards, setNumCards]     = useState(8);
  const [current, setCurrent]       = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [error, setError]           = useState("");

  // Load saved cards on mount
  useEffect(() => {
    api.get("/flashcards/")
      .then(r => {
        // Backend returns { cards: [...] }
        const list = r.data?.cards || r.data || [];
        setCards(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    if (!topic.trim()) { setError("Please enter a topic."); return; }
    setGenerating(true);
    setError("");
    try {
      const res = await api.post("/flashcards/generate", { topic, num_cards: numCards });
      // Backend returns { cards: [...] }
      const newCards = res.data?.cards || [];
      if (newCards.length === 0) {
        setError("AI returned no flashcards. Try a different topic.");
        return;
      }
      setCards(prev => [...newCards, ...prev]);
      setCurrent(0);
      setFlipped(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Generation failed. Check GROQ_API_KEY.");
    } finally {
      setGenerating(false);
    }
  };

  const rate = async (rating) => {
    const card = cards[current];
    if (!card) return;
    try { await api.patch(`/flashcards/${card.id}/rate`, { rating }); } catch {}
    const next = current < cards.length - 1 ? current + 1 : 0;
    setCurrent(next);
    setFlipped(false);
  };

  const deleteCard = async (id) => {
    try { await api.delete(`/flashcards/${id}`); } catch {}
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    if (current >= updated.length) setCurrent(Math.max(0, updated.length - 1));
    setFlipped(false);
  };

  const prev = () => { setCurrent(p => Math.max(0, p - 1)); setFlipped(false); };
  const next = () => { setCurrent(p => Math.min(cards.length - 1, p + 1)); setFlipped(false); };

  // Each card has card.question and card.answer from the backend
  const card = cards[current];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "3px solid rgba(124,106,247,0.2)",
          borderTop: "3px solid var(--accent)", borderRadius: "50%",
          animation: "spin .8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>Loading flashcards…</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          🃏 AI Flashcards
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          Powered by Groq · Spaced repetition rating system
        </p>
      </div>

      {/* Generator */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          ✨ Generate Flashcards
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>Topic</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generate()}
              placeholder="e.g. Gradient Descent, SQL Joins, React Hooks…"
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text)", fontFamily: "inherit", fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 5 }}>Count</label>
            <select
              value={numCards}
              onChange={e => setNumCards(parseInt(e.target.value))}
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text)", fontFamily: "inherit", fontSize: 14,
              }}
            >
              {[5, 8, 10, 15].map(n => <option key={n} value={n}>{n} cards</option>)}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: "10px 20px", border: "none", borderRadius: 10,
              background: "linear-gradient(135deg,var(--accent),#5b4de8)",
              color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              cursor: generating ? "not-allowed" : "pointer",
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? "⏳ Generating…" : "🤖 Generate"}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13,
            background: "rgba(248,113,113,0.1)", color: "var(--red)",
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* No cards */}
      {cards.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🃏</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No Flashcards Yet
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>
            Enter a topic above and click Generate.
          </p>
        </div>
      )}

      {/* Active card */}
      {card && (
        <>
          {/* Nav bar */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12, maxWidth: 580, margin: "0 auto 12px",
          }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              Card {current + 1} of {cards.length}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <NavBtn onClick={prev} disabled={current === 0}>← Prev</NavBtn>
              <NavBtn onClick={next} disabled={current === cards.length - 1}>Next →</NavBtn>
              <NavBtn onClick={() => {
                setCards(p => [...p].sort(() => Math.random() - .5));
                setCurrent(0); setFlipped(false);
              }}>🔀</NavBtn>
            </div>
          </div>

          {/* Flip card — uses card.question and card.answer */}
          <div
            onClick={() => setFlipped(p => !p)}
            style={{ perspective: 1000, height: 220, maxWidth: 580, margin: "0 auto 20px", cursor: "pointer" }}
          >
            <div style={{
              position: "relative", width: "100%", height: "100%",
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "none",
              transition: ".5s cubic-bezier(.4,0,.2,1)",
            }}>
              {/* Front — question */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 16, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 28px", textAlign: "center",
              }}>
                <div style={{
                  fontSize: 11, color: "var(--text3)", textTransform: "uppercase",
                  letterSpacing: ".1em", marginBottom: 14,
                }}>
                  Question
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.6, color: "var(--text)" }}>
                  {card.question}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 16 }}>
                  Tap to reveal answer →
                </div>
              </div>

              {/* Back — answer */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg,rgba(124,106,247,0.18),rgba(244,114,182,0.10))",
                border: "1px solid rgba(124,106,247,0.35)", borderRadius: 16,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 28px", textAlign: "center",
              }}>
                <div style={{
                  fontSize: 11, color: "rgba(124,106,247,0.8)", textTransform: "uppercase",
                  letterSpacing: ".1em", marginBottom: 14,
                }}>
                  Answer
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>
                  {card.answer}
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
            <RateBtn color="var(--red)"   onClick={() => rate("hard")}>😰 Hard</RateBtn>
            <RateBtn color="var(--amber)" onClick={() => rate("medium")}>🤔 OK</RateBtn>
            <RateBtn color="var(--green)" onClick={() => rate("easy")}>✅ Easy</RateBtn>
          </div>
        </>
      )}

      {/* Cards grid */}
      {cards.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
          gap: 10,
        }}>
          {cards.map((c, i) => (
            <div
              key={c.id || i}
              onClick={() => { setCurrent(i); setFlipped(false); }}
              style={{
                background: "var(--surface)",
                border: `1px solid ${i === current ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12, padding: 14, cursor: "pointer", transition: ".15s",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>
                Card {i + 1}
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.5, marginBottom: 8,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              }}>
                {c.question}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: c.difficulty_rating === "easy" ? "var(--green)"
                       : c.difficulty_rating === "hard" ? "var(--red)"
                       : "var(--amber)",
                }}>
                  {c.difficulty_rating || "medium"}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); deleteCard(c.id); }}
                  style={{
                    fontSize: 11, color: "var(--red)", background: "none",
                    border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 13px", borderRadius: 8, border: "1px solid var(--border2)",
        background: "transparent", color: disabled ? "var(--text3)" : "var(--text2)",
        fontFamily: "inherit", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function RateBtn({ onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px", borderRadius: 10,
        border: `1px solid ${color}44`,
        background: `${color}18`, color,
        fontFamily: "inherit", fontSize: 13,
        fontWeight: 500, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
