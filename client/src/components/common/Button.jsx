import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = "left",
  onClick,
  type = "button",
  style = {},
  className = "",
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--brand-accent)",
          color: "#FFFFFF",
          border: "1px solid transparent",
        };
      case "secondary":
        return {
          backgroundColor: "var(--muted-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--subtle-border)",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--text-primary)",
          border: "1px solid var(--subtle-border)",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "var(--text-primary)",
          border: "1px solid transparent",
        };
      case "danger":
        return {
          backgroundColor: "var(--danger)",
          color: "#FFFFFF",
          border: "1px solid transparent",
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          height: "34px",
          padding: "0 12px",
          fontSize: "0.8125rem",
          gap: "6px",
        };
      case "lg":
        return {
          height: "48px",
          padding: "0 24px",
          fontSize: "1rem",
          gap: "10px",
        };
      case "md":
      default:
        return {
          height: "40px",
          padding: "0 18px",
          fontSize: "0.875rem",
          gap: "8px",
        };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`btn-component ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "all var(--transition-fast)",
        userSelect: "none",
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2
          size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
          style={{ animation: "spin 1s linear infinite" }}
        />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
        </>
      )}
    </button>
  );
}
