import React from "react";

const SIZES = {
  xs: { dimension: 24, fontSize: "0.6875rem" },
  sm: { dimension: 32, fontSize: "0.75rem" },
  md: { dimension: 40, fontSize: "0.875rem" },
  lg: { dimension: 56, fontSize: "1.125rem" },
  xl: { dimension: 88, fontSize: "1.75rem" },
  xxl: { dimension: 120, fontSize: "2.25rem" },
};

export default function Avatar({ src, alt = "User", size = "md", style = {}, className = "" }) {
  const { dimension, fontSize } = SIZES[size] || SIZES.md;
  const initials = alt ? alt.substring(0, 2).toUpperCase() : "FR";

  return (
    <div
      className={`avatar-wrapper ${className}`}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: "var(--radius-full)",
        overflow: "hidden",
        backgroundColor: "var(--muted-surface)",
        border: "1px solid var(--subtle-border)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        userSelect: "none",
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            // Fallback to initials if image link breaks
            e.target.style.display = "none";
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize,
            color: "var(--text-secondary)",
            letterSpacing: "0.02em",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
