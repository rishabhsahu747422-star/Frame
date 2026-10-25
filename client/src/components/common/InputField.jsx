import React, { useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  isTextArea = false,
  rows = 3,
  className = "",
  style = {},
  ...props
}) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`input-field-group ${className}`} style={{ marginBottom: "16px", ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontSize: "0.8125rem",
            fontWeight: 500,
            marginBottom: "6px",
            color: error ? "var(--danger)" : "var(--text-secondary)",
            letterSpacing: "0.01em",
          }}
        >
          {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}

      <div style={{ position: "relative" }}>
        {isTextArea ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            style={{
              width: "100%",
              padding: "10px 14px",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: `1px solid ${error ? "var(--danger)" : "var(--subtle-border)"}`,
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              resize: "vertical",
              transition: "border-color var(--transition-fast)",
            }}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={actualType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            style={{
              width: "100%",
              height: "44px",
              padding: isPassword ? "0 42px 0 14px" : "0 14px",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: `1px solid ${error ? "var(--danger)" : "var(--subtle-border)"}`,
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              transition: "border-color var(--transition-fast)",
            }}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          style={{
            fontSize: "0.75rem",
            color: "var(--danger)",
            marginTop: "4px",
            lineHeight: 1.3,
          }}
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginTop: "4px",
            lineHeight: 1.3,
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
