import React from "react";
import { Link } from "react-router-dom";

/**
 * FRAME Official Brand Logo Component
 * Exactly matched to the approved reference design board.
 *
 * @param {Object} props
 * @param {"full" | "icon" | "compact" | "monochrome"} [props.variant="full"] - Display variant
 * @param {"xs" | "sm" | "md" | "lg" | "xl" | number} [props.size="md"] - Visual scale
 * @param {string} [props.subtitle] - Optional subtitle (e.g., "Editorial Photography" or "CAPTURE / CREATE / CONNECT")
 * @param {string} [props.linkTo] - Optional router destination. If omitted, renders unlinked container
 * @param {string} [props.className] - CSS class override
 * @param {React.CSSProperties} [props.style] - Inline style overrides
 * @param {boolean} [props.animated=false] - Subtle pulse animation for loading or focus states
 */
export default function Logo({
  variant = "full",
  size = "md",
  subtitle,
  linkTo,
  className = "",
  style = {},
  animated = false,
  ...props
}) {
  // Proportional metrics mapping
  const sizeMap = {
    xs: { icon: 20, font: "0.95rem", tracking: "0.22em", gap: 7, subtitleFont: "0.55rem" },
    sm: { icon: 26, font: "1.15rem", tracking: "0.24em", gap: 9, subtitleFont: "0.62rem" },
    md: { icon: 34, font: "1.45rem", tracking: "0.26em", gap: 11, subtitleFont: "0.70rem" },
    lg: { icon: 44, font: "1.85rem", tracking: "0.28em", gap: 14, subtitleFont: "0.78rem" },
    xl: { icon: 56, font: "2.35rem", tracking: "0.30em", gap: 16, subtitleFont: "0.85rem" },
  };

  const currentSize =
    typeof size === "number"
      ? {
          icon: size,
          font: `${size * 0.44}px`,
          tracking: "0.26em",
          gap: Math.round(size * 0.32),
          subtitleFont: `${size * 0.22}px`,
        }
      : sizeMap[size] || sizeMap.md;

  const isMono = variant === "monochrome";
  const isIconOnly = variant === "icon";
  const isCompact = variant === "compact";

  const cyanFill = isMono ? "currentColor" : "url(#frame-logo-cyan)";
  const textColor = isMono ? "currentColor" : "var(--text-primary, #F2F2F2)";

  // The Exact Official Reference Symbol (Viewfinder Aperture Mark)
  const LogoSymbol = (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FRAME Brandmark"
      style={{
        flexShrink: 0,
        display: "block",
        transition: "transform var(--transition-fast, 150ms ease)",
        animation: animated ? "pulse 2s ease-in-out infinite" : undefined,
      }}
    >
      <title>FRAME Logo</title>
      <defs>
        {!isMono && (
          <linearGradient id="frame-logo-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16DCEB" />
            <stop offset="100%" stopColor="#42E5F0" />
          </linearGradient>
        )}
      </defs>

      {/* Top-Left Outer Frame */}
      <path
        d="M 21.5 6 H 82 C 88 6 92.7 10.7 92.7 16.5 V 21.5 H 81.5 L 81.5 21 C 81.5 18.5 79.5 16.5 77 16.5 H 24.5 C 20.1 16.5 16.5 20.1 16.5 24.5 V 78.5 C 16.5 82.9 20.1 86.5 24.5 86.5 H 27.2 V 94 H 21.5 C 13.5 94 7 87.5 7 79.5 V 20.5 C 7 12.5 13.5 6 21.5 6 Z"
        fill={cyanFill}
      />

      {/* Inner "F" Aperture Arm & Stem */}
      <path
        d="M 44 32 H 75.5 L 67.5 41 H 47 C 45 41 43.5 42.5 43.5 44.5 V 76 L 34.5 85 V 43.5 C 34.5 37 38.5 32 44 32 Z"
        fill={cyanFill}
      />

      {/* Bottom-Right Outer Frame */}
      <path
        d="M 91.5 37 L 82.5 45 V 77 C 82.5 81.5 79 84.5 75 84.5 H 57.5 L 49.5 94 H 78.5 C 86.5 94 93 87.5 93 79.5 V 39 C 93 38.2 92.3 37.4 91.5 37 Z"
        fill={cyanFill}
      />

      {/* Central Focal Aperture Dot */}
      <circle
        cx="58"
        cy="55.5"
        r="5.2"
        fill={cyanFill}
      />
    </svg>
  );

  // Icon-only variant
  if (isIconOnly) {
    if (linkTo) {
      return (
        <Link
          to={linkTo}
          className={`frame-logo-link ${className}`}
          aria-label="FRAME Home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            ...style,
          }}
          {...props}
        >
          {LogoSymbol}
        </Link>
      );
    }
    return (
      <div
        className={`frame-logo ${className}`}
        style={{ display: "inline-flex", alignItems: "center", ...style }}
        {...props}
      >
        {LogoSymbol}
      </div>
    );
  }

  // Helper to format subtitle with cyan slashes if present
  const renderSubtitle = (text) => {
    if (!text) return null;
    if (text.includes("/")) {
      const parts = text.split("/");
      return (
        <span
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: currentSize.subtitleFont,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "var(--text-secondary, #A3A3A3)",
            marginTop: "4px",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {parts.map((p, idx) => (
            <React.Fragment key={idx}>
              <span>{p.trim()}</span>
              {idx < parts.length - 1 && (
                <span style={{ color: "var(--brand-accent, #16DCEB)", fontWeight: 700 }}>/</span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return (
      <span
        style={{
          fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
          fontSize: currentSize.subtitleFont,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-secondary, #A3A3A3)",
          marginTop: "4px",
          lineHeight: 1,
        }}
      >
        {text}
      </span>
    );
  };

  // Full and Compact Content Layout
  const logoContent = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${currentSize.gap}px`,
        lineHeight: 1,
      }}
    >
      {LogoSymbol}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
              fontSize: currentSize.font,
              fontWeight: 800,
              letterSpacing: currentSize.tracking,
              color: textColor,
              lineHeight: 1,
            }}
          >
            FRAME
          </span>
        </div>
        {subtitle && renderSubtitle(subtitle)}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className={`frame-logo-link ${className}`}
        aria-label="FRAME Home"
        style={{
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
          color: "inherit",
          ...style,
        }}
        {...props}
      >
        {logoContent}
      </Link>
    );
  }

  return (
    <div
      className={`frame-logo ${className}`}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
      {...props}
    >
      {logoContent}
    </div>
  );
}
