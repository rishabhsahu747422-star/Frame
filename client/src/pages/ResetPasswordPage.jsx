import React, { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { authApi } from "../api/auth.api.js";
import Button from "../components/common/Button.jsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing from the URL. Please re-open the link from your email.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Password reset failed. The token may be invalid or expired.");
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
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Create New Password
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Set a new secure password for your FRAME account.
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

        {success ? (
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
              Password Reset Complete
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text)", marginBottom: "1.5rem" }}>
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
            <Link to="/login">
              <Button variant="primary" style={{ width: "100%" }}>
                Sign In to FRAME
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="new-password"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.4rem",
                  color: "var(--color-text)",
                }}
              >
                New Password (8+ characters)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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

            <div style={{ marginBottom: "2rem" }}>
              <label
                htmlFor="confirm-password"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.4rem",
                  color: "var(--color-text)",
                }}
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !newPassword || !confirmPassword}
              style={{ width: "100%" }}
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
