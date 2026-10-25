import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error loading this content.",
  onRetry,
  style = {},
}) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        minHeight: "220px",
        ...style,
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--danger-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          color: "var(--danger)",
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          maxWidth: "360px",
          lineHeight: 1.5,
          marginBottom: onRetry ? "18px" : "0",
        }}
      >
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
