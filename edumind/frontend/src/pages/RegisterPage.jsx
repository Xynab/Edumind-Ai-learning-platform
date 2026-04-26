import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name: "", email: "", password: "", goal: "" });
  const [error, setError]       = useState("");
  const [errorType, setErrorType] = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setErrorType(""); setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.goal);
      navigate("/");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "";

      if (status === 409) {
        setErrorType("already_exists");
        setError("An account with this email already exists.");
      } else {
        setErrorType("other");
        setError(detail || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({
    value: form[key],
    onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
  });

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
        width: 440, maxWidth: "95vw",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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
            Join{" "}
            <span style={{
              background: "linear-gradient(90deg,#7c6af7,#f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              EduMind AI
            </span>
          </h2>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>
            Start your AI-powered learning journey
          </p>
        </div>

        <form onSubmit={handle}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 12, marginBottom: 14,
          }}>
            <div>
              <label style={{
                fontSize: 13, color: "var(--text2)",
                display: "block", marginBottom: 5,
              }}>
                Full Name
              </label>
              <input placeholder="Alex Johnson" {...f("name")} required />
            </div>
            <div>
              <label style={{
                fontSize: 13, color: "var(--text2)",
                display: "block", marginBottom: 5,
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="alex@uni.edu"
                {...f("email")}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              fontSize: 13, color: "var(--text2)",
              display: "block", marginBottom: 5,
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              {...f("password")}
              required
              minLength={8}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 13, color: "var(--text2)",
              display: "block", marginBottom: 5,
            }}>
              Primary Goal
            </label>
            <select {...f("goal")}>
              <option value="">Select your goal</option>
              <option>Academic Excellence</option>
              <option>Career Transition</option>
              <option>Skill Development</option>
              <option>Exam Preparation</option>
            </select>
          </div>

          {/* Error messages */}
          {error && (
            <div style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 13, color: "var(--red)", marginBottom: 14,
            }}>
              <div>⚠️ {error}</div>

              {errorType === "already_exists" && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid rgba(248,113,113,0.2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ color: "var(--text2)" }}>
                    Already have an account?
                  </span>
                  <Link
                    to="/login"
                    style={{
                      color: "var(--accent)", fontWeight: 600,
                      fontSize: 13, textDecoration: "none",
                      background: "rgba(124,106,247,0.12)",
                      padding: "4px 12px", borderRadius: 20,
                    }}
                  >
                    Sign in →
                  </Link>
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
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text2)", marginTop: 18 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}