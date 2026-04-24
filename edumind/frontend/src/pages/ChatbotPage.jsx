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

function renderContent(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(124,106,247,0.3)",
          borderRadius: 8, padding: "12px 14px",
          fontSize: 13, overflowX: "auto",
          margin: "8px 0", lineHeight: 1.6,
          fontFamily: "monospace",
          color: "#e2e8f0",
        }}>
          {lang && (
            <div style={{
              fontSize: 11, color: "var(--accent)",
              marginBottom: 6, fontFamily: "inherit",
            }}>
              {lang}
            </div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      elements.push(
        <div key={i} style={{
          fontWeight: 700, fontSize: 15,
          margin: "10px 0 4px", color: "var(--accent)",
        }}>
          {line.slice(4)}
        </div>
      );
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <div key={i} style={{
          fontWeight: 700, fontSize: 16,
          margin: "12px 0 4px",
        }}>
          {line.slice(3)}
        </div>
      );
      i++; continue;
    }

    // Bullet points
    if (line.startsWith("* ") || line.startsWith("- ")) {
      elements.push(
        <div key={i} style={{
          display: "flex", gap: 8,
          margin: "3px 0", paddingLeft: 4,
        }}>
          <span style={{ color: "var(--accent)", flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} style={{
          display: "flex", gap: 8,
          margin: "3px 0", paddingLeft: 4,
        }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, minWidth: 16 }}>
            {num}.
          </span>
          <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <div key={i} style={{ margin: "2px 0" }}>
        {renderInline(line)}
      </div>
    );
    i++;
  }

  return elements;
}

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code key={key++} style={{
          background: "rgba(124,106,247,0.2)",
          padding: "1px 6px", borderRadius: 4,
          fontSize: 13, fontFamily: "monospace",
          color: "var(--accent)",
        }}>
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)$/s);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^(.*?)\*(.*?)\*(.*)$/s);
    if (italicMatch && !italicMatch[2].includes("*")) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 && typeof parts[0]?.props?.children === "string"
    ? parts[0].props.children
    : <>{parts}</>;
}

function MsgBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 10, maxWidth: "80%",
      alignSelf: isUser ? "flex-end" : "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 15,
        background: isUser
          ? "linear-gradient(135deg,#f472b6,#7c6af7)"
          : "linear-gradient(135deg,#7c6af7,#22d3ee)",
      }}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{
        padding: "11px 15px", borderRadius: 16, fontSize: 14,
        lineHeight: 1.7, maxWidth: "calc(100% - 44px)",
        background: isUser
          ? "linear-gradient(135deg,var(--accent),var(--accent2))"
          : "var(--surface2)",
        border: isUser ? "none" : "1px solid var(--border)",
        color: isUser ? "#fff" : "var(--text)",
        borderTopRightRadius: isUser ? 4 : 16,
        borderTopLeftRadius: isUser ? 16 : 4,
        wordBreak: "break-word",
      }}>
        {isUser
          ? msg.content
          : renderContent(msg.content)
        }
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg,#7c6af7,#22d3ee)",
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 15,
      }}>🤖</div>
      <div style={{
        display: "flex", gap: 5, padding: "14px 16px",
        background: "var(--surface2)", border: "1px solid var(--border)",
        borderRadius: 16, borderTopLeftRadius: 4,
      }}>
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
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages]         = useState([DEFAULT_MSG]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get("/chat/history")
      .then(res => {
        const msgs = res.data?.messages || [];
        if (msgs.length > 0) setMessages(msgs);
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
      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Connection failed.";
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

      <Card style={{
        padding: 0, display: "flex", flexDirection: "column",
        height: "calc(100vh - 210px)", minHeight: 400,
      }}>
        <div style={{
          flex: 1, overflowY: "auto", padding: 20,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {!historyLoaded && (
            <div style={{
              textAlign: "center", padding: "20px 0",
              color: "var(--text3)", fontSize: 13,
            }}>
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
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); send();
              }
            }}
            placeholder="Ask me anything — math, science, coding, history…"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Btn onClick={() => send()} disabled={loading || !input.trim()}>
            Send ↗
          </Btn>
        </div>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div style={{
          fontFamily: "Syne,sans-serif",
          fontSize: 14, fontWeight: 600, marginBottom: 10,
        }}>
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
              onMouseOver={e => {
                if (!loading) {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.color = "var(--accent)";
                }
              }}
              onMouseOut={e => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.color = "var(--text2)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}