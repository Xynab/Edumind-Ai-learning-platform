import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "not_found" | "wrong_password" | "other"
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setErrorType(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      const status = err.response?.status;

      if (detail.toLowerCase().includes("not found") ||
          detail.toLowerCase().includes("no account") ||
          detail.toLowerCase().includes("does not exist") ||
          status === 404) {
        setErrorType("not_found");
        setError("No account found with this email.");
      } else if (detail.toLowerCase().includes("password") ||
                 detail.toLowerCase().includes("incorrect") ||
                 detail.toLowerCase().includes("invalid") ||
                 status === 401) {
        setErrorType("wrong_password");
        setError("Incorrect password. Please try again.");
      } else {
        setErrorType("other");
        setError(detail || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, rgba(124,106,247,0.15) 0%, transparent 70%), var(--bg)",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: 20, padding: 40,
        width: 420, maxWidth: "95vw",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: "linear-gradient(135deg,#7c6af7,#f472b6)",
            borderRadius: 12, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "Syne,sans-serif",
            fontWeight: 800, fontSize: 22, color: "#fff",
            margin: "0 auto 12px",
          }}>E</div>
          <h2 style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 22, fontWeight: 800, marginBottom: 4,
          }}>
            EduMind{" "}
            <span style={{
              background: "linear-gradient(90deg,#7c6af7,#f472b6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>AI</span>
          </h2>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>
            Your Personal AI Tutor & Career Guide
          </p>
        </div>

        <form onSubmit={handle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: 13, fontWeight: 500,
              color: "var(--text2)", display: "block", marginBottom: 6,
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="student@university.edu"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 13, fontWeight: 500,
              color: "var(--text2)", display: "block", marginBottom: 6,
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 13, color: "var(--red)", marginBottom: 16,
            }}>
              <div style={{ marginBottom: errorType === "not_found" ? 8 : 0 }}>
                ⚠️ {error}
              </div>
              {errorType === "not_found" && (
                <div style={{ fontSize: 13 }}>
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    style={{ color: "var(--accent)", fontWeight: 600 }}
                  >
                    Register for free →
                  </Link>
                </div>
              )}
              {errorType === "wrong_password" && (
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Forgot your password? Try registering again with a new account.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0",
              background: "linear-gradient(135deg,var(--accent),var(--accent2))",
              color: "#fff", border: "none", borderRadius: 10,
              fontFamily: "inherit", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginBottom: 16,
            }}
          >
            {loading ? "Signing in…" : "Sign In to Learn"}
          </button>
        </form>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 16, color: "var(--text3)", fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          or
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: 500 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}