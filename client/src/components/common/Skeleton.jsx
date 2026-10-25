import React from "react";

export default function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "var(--radius-sm)",
  style = {},
  className = "",
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--skeleton-base)",
        backgroundImage: `linear-gradient(90deg, var(--skeleton-base) 0%, var(--skeleton-highlight) 50%, var(--skeleton-base) 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
        ...style,
      }}
    />
  );
}
