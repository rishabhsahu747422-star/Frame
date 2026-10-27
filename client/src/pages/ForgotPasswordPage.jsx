import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { authApi } from "../api/auth.api.js";
import Button from "../components/common/Button.jsx";
import Logo from "../components/common/Logo.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit password recovery request.");
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
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text-secondary)",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <Logo variant="icon" size="lg" linkTo="/" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Reset Password
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Enter your account email to receive a secure password recovery link.
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

        {submitted ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem 1rem",
              background: "var(--color-accent-soft)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-accent)",
            }}
          >
            <CheckCircle2 size={36} color="var(--color-accent)" style={{ marginBottom: "0.75rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Check Your Inbox
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text)", lineHeight: 1.5 }}>
              If an account with <strong>{email}</strong> exists, instructions and a 10-minute reset link have been sent.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="recovery-email"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.4rem",
                  color: "var(--color-text)",
                }}
              >
                Account Email
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="recovery-email"
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
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !email.trim()}
              style={{ width: "100%" }}
            >
              Send Recovery Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
