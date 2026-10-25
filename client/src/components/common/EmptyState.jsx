import React from "react";
import Button from "./Button.jsx";

export default function EmptyState({
  icon: Icon,
  title = "Nothing to display",
  description = "No content is available at this time.",
  actionLabel,
  onAction,
  style = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--text-secondary)",
        minHeight: "240px",
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--muted-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            color: "var(--brand-accent)",
          }}
        >
          <Icon size={28} />
        </div>
      )}
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
          maxWidth: "380px",
          lineHeight: 1.5,
          marginBottom: actionLabel ? "20px" : "0",
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
