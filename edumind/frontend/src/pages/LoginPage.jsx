import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [errorType, setErrorType] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showAdminHint, setShowAdminHint] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setErrorType(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "";
      if (status === 404) {
        setErrorType("not_found");
        setError("No account found with this email.");
      } else if (status === 401) {
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

  const fillAdmin = () => {
    setForm({ email: "zainab@gmail.com", password: "" });
    setShowAdminHint(false);
    setError(""); setErrorType("");
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
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>AI</span>
          </h2>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>
            Your Personal AI Tutor & Career Guide
          </p>
        </div>

        {/* Admin login button */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowAdminHint(p => !p)}
            style={{
              width: "100%", padding: "11px 16px",
              background: showAdminHint
                ? "rgba(248,113,113,0.12)"
                : "rgba(124,106,247,0.08)",
              border: `1px solid ${showAdminHint
                ? "rgba(248,113,113,0.3)"
                : "rgba(124,106,247,0.25)"}`,
              borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "inherit", transition: ".2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚙️</span>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: showAdminHint ? "var(--red)" : "var(--accent)",
                }}>
                  Admin Login
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  Platform administrator access
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 12, color: "var(--text3)",
              transform: showAdminHint ? "rotate(180deg)" : "none",
              transition: ".2s", display: "inline-block",
            }}>
              ▼
            </span>
          </button>

          {/* Admin hint panel */}
          {showAdminHint && (
            <div style={{
              marginTop: 8, padding: "14px 16px",
              background: "rgba(124,106,247,0.06)",
              border: "1px solid rgba(124,106,247,0.2)",
              borderRadius: 10,
            }}>
              <div style={{
                fontSize: 12, color: "var(--text2)",
                marginBottom: 10, lineHeight: 1.6,
              }}>
                🔐 Use your admin credentials to access the admin panel.
                Admin accounts have full platform management access.
              </div>
              <button
                onClick={fillAdmin}
                style={{
                  padding: "7px 16px",
                  background: "linear-gradient(135deg,var(--accent),#5b4de8)",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontFamily: "inherit", fontSize: 12,
                  fontWeight: 500, cursor: "pointer",
                }}
              >
                ⚙️ Fill Admin Email
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 20, color: "var(--text3)", fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          or sign in as learner
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Login form */}
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

          {/* Error messages */}
          {error && (
            <div style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 13, color: "var(--red)", marginBottom: 16,
            }}>
              <div>⚠️ {error}</div>
              {errorType === "not_found" && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid rgba(248,113,113,0.2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ color: "var(--text2)" }}>
                    Don't have an account?
                  </span>
                  <Link
                    to="/register"
                    style={{
                      color: "var(--accent)", fontWeight: 600,
                      fontSize: 13, textDecoration: "none",
                      background: "rgba(124,106,247,0.12)",
                      padding: "4px 12px", borderRadius: 20,
                    }}
                  >
                    Register free →
                  </Link>
                </div>
              )}
              {errorType === "wrong_password" && (
                <div style={{ marginTop: 6, color: "var(--text2)" }}>
                  Forgot your password? Try creating a new account.
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
