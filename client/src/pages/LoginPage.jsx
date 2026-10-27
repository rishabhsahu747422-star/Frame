import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Button from "../components/common/Button.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/home";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      showToast("Welcome back to FRAME", "success");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem 2rem",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: "800",
              letterSpacing: "0.15em",
              color: "var(--color-text)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "0.5rem",
            }}
          >
            FRAME
          </Link>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Sign in to your editorial photography workspace
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--danger-surface)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: "600",
                marginBottom: "0.4rem",
                color: "var(--color-text)",
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="curator@example.com"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          {/* Password input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "var(--color-text)",
                }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-accent)",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 2.5rem 0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: "1.75rem", marginBottom: "1.5rem" }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !email.trim() || !password}
              style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              Sign In to FRAME
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: "center", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            New to FRAME?{" "}
            <Link
              to="/register"
              style={{
                color: "var(--color-accent)",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
