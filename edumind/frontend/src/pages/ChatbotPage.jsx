import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { PageWrapper, PageHeader, Card, Btn } from "../components/common/PageWrapper";

const SUGGESTIONS = [
  "Explain gradient descent simply",
  "What is overfitting in ML?",
  "How do neural networks learn?",
  "Explain SQL JOINs with examples",
  "What is the bias-variance tradeoff?",
  "How does backpropagation work?",
  "What is Docker and why use it?",
  "Explain REST API concepts",
  "What is KMeans clustering?",
  "How does the transformer architecture work?",
];

const DEFAULT_MSG = {
  role: "assistant",
  content: "Hi! I'm EduMind AI, your personal tutor powered by Groq. Ask me anything — concepts, problems, code, math, career advice. What would you like to learn today? 📚",
};

function MsgBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display:"flex", gap:10, maxWidth:"80%",
      alignSelf: isUser ? "flex-end" : "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
    }}>
      <div style={{
        width:32, height:32, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
        background: isUser
          ? "linear-gradient(135deg,#f472b6,#7c6af7)"
          : "linear-gradient(135deg,#7c6af7,#22d3ee)",
      }}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{
        padding:"11px 15px", borderRadius:16, fontSize:14, lineHeight:1.7,
        maxWidth: "calc(100% - 44px)",
        background: isUser
          ? "linear-gradient(135deg,var(--accent),var(--accent2))"
          : "var(--surface2)",
        border: isUser ? "none" : "1px solid var(--border)",
        color: isUser ? "#fff" : "var(--text)",
        borderTopRightRadius: isUser ? 4 : 16,
        borderTopLeftRadius:  isUser ? 16 : 4,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display:"flex", gap:10, alignSelf:"flex-start" }}>
      <div style={{
        width:32, height:32, borderRadius:"50%",
        background:"linear-gradient(135deg,#7c6af7,#22d3ee)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
      }}>🤖</div>
      <div style={{
        display:"flex", gap:5, padding:"14px 16px", background:"var(--surface2)",
        border:"1px solid var(--border)", borderRadius:16, borderTopLeftRadius:4,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width:8, height:8, borderRadius:"50%", background:"var(--accent)",
            animation:"bounce .8s ease-in-out infinite",
            animationDelay:`${i * 0.15}s`,
          }} />
        ))}
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-6px);opacity:1}}`}</style>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([DEFAULT_MSG]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    api.get("/chat/history")
      .then(res => {
        const msgs = res.data?.messages || [];
        if (msgs.length > 0) {
          setMessages(msgs);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-11, -1).map(m => ({
        role: m.role, content: m.content,
      }));
      const res = await api.post("/chat/", { message: msg, history });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Connection failed. Make sure the backend is running.";
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try { await api.delete("/chat/history"); } catch {}
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you learn today? 📚",
    }]);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="🤖 AI Tutor"
        subtitle="Powered by Groq AI — ask anything, get expert explanations"
        action={<Btn variant="ghost" size="sm" onClick={clearChat}>Clear Chat</Btn>}
      />

      <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: "calc(100vh - 210px)", minHeight: 400 }}>
        <div style={{
          flex: 1, overflowY: "auto", padding: 20,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {!historyLoaded && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>
              Loading chat history…
            </div>
          )}
          {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
          {loading && <LoadingDots />}
          <div ref={bottomRef} />
        </div>

        <div style={{
          padding: 16, borderTop: "1px solid var(--border)",
          display: "flex", gap: 10,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask me anything — math, science, coding, history…"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Btn onClick={() => send()} disabled={loading || !input.trim()}>Send ↗</Btn>
        </div>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          💡 Suggested Questions
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              style={{
                padding: "6px 13px", background: "var(--surface2)",
                border: "1px solid var(--border)", borderRadius: 8,
                fontSize: 12, color: "var(--text2)",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: ".15s",
              }}
              onMouseOver={e => { if (!loading) { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}}
              onMouseOut={e  => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text2)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}