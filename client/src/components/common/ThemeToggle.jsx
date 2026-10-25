import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle({ style = {}, showLabel = false }) {
  const { activeTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${activeTheme === "dark" ? "light" : "dark"} theme`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-secondary)",
        backgroundColor: "transparent",
        transition: "color var(--transition-fast), background-color var(--transition-fast)",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text-primary)";
        e.currentTarget.style.backgroundColor = "var(--muted-surface)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-secondary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {activeTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {showLabel && (
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
          {activeTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
