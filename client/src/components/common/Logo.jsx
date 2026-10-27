import React from "react";
import { Link } from "react-router-dom";

/**
 * FRAME Official Brand Logo Component
 *
 * @param {Object} props
 * @param {"full" | "icon" | "compact" | "monochrome"} [props.variant="full"] - Display variant
 * @param {"xs" | "sm" | "md" | "lg" | "xl" | number} [props.size="md"] - Visual scale
 * @param {string} [props.subtitle] - Optional subtitle (e.g., "Editorial Photography")
 * @param {string} [props.linkTo] - Optional router destination. If not provided, renders unlinked container
 * @param {string} [props.className] - CSS class override
 * @param {React.CSSProperties} [props.style] - Inline style overrides
 * @param {boolean} [props.animated=false] - Subtle hover focus animation
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
  // Size metrics mapping
  const sizeMap = {
    xs: { icon: 20, font: "0.95rem", tracking: "0.14em", gap: 6, subtitleFont: "0.55rem" },
    sm: { icon: 26, font: "1.15rem", tracking: "0.16em", gap: 8, subtitleFont: "0.625rem" },
    md: { icon: 32, font: "1.4rem", tracking: "0.18em", gap: 10, subtitleFont: "0.7rem" },
    lg: { icon: 42, font: "1.85rem", tracking: "0.20em", gap: 12, subtitleFont: "0.75rem" },
    xl: { icon: 54, font: "2.35rem", tracking: "0.22em", gap: 14, subtitleFont: "0.85rem" },
  };

  const currentSize =
    typeof size === "number"
      ? { icon: size, font: `${size * 0.44}px`, tracking: "0.18em", gap: Math.round(size * 0.3), subtitleFont: "0.65rem" }
      : sizeMap[size] || sizeMap.md;

  const isMono = variant === "monochrome";
  const isIconOnly = variant === "icon";
  const isCompact = variant === "compact";

  const cyanAccent = isMono ? "currentColor" : "var(--brand-accent, #16DCEB)";
  const strokeColor = isMono ? "currentColor" : "var(--text-primary, #F2F2F2)";

  // Viewfinder + Aperture Geometric Icon
  const LogoIcon = (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FRAME Viewfinder Logo"
      style={{
        flexShrink: 0,
        display: "block",
        transition: animated ? "transform var(--transition-fast, 150ms ease)" : undefined,
      }}
    >
      <title>FRAME Logo</title>
      <defs>
        {!isMono && (
          <linearGradient id={`frame-cyan-${currentSize.icon}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16DCEB" />
            <stop offset="100%" stopColor="#42E5F0" />
          </linearGradient>
        )}
      </defs>

      {/* Viewfinder Frame Corner Brackets */}
      {/* Top-Left */}
      <path
        d="M 4 12.5 V 6.5 C 4 5.12 5.12 4 6.5 4 H 12.5"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top-Right (Shutter & Focus Point Accent) */}
      <path
        d="M 23.5 4 H 29.5 C 30.88 4 32 5.12 32 6.5 V 12.5"
        stroke={isMono ? "currentColor" : `url(#frame-cyan-${currentSize.icon})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-Right */}
      <path
        d="M 32 23.5 V 29.5 C 32 30.88 30.88 32 29.5 32 H 23.5"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-Left */}
      <path
        d="M 12.5 32 H 6.5 C 5.12 32 4 30.88 4 29.5 V 23.5"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lens Iris Perimeter */}
      <circle
        cx="18"
        cy="18"
        r="8"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeOpacity="0.85"
      />

      {/* Precision Aperture Blades */}
      <g stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" opacity="0.65">
        <line x1="18" y1="10" x2="21.5" y2="16.5" />
        <line x1="24.9" y1="14" x2="21.5" y2="19.5" />
        <line x1="24.9" y1="22" x2="18" y2="21" />
        <line x1="18" y1="26" x2="14.5" y2="19.5" />
        <line x1="11.1" y1="22" x2="14.5" y2="16.5" />
        <line x1="11.1" y1="14" x2="18" y2="15" />
      </g>

      {/* Central Cyan Focal Sensor */}
      <circle
        cx="18"
        cy="18"
        r="3"
        fill={isMono ? "currentColor" : `url(#frame-cyan-${currentSize.icon})`}
      />
    </svg>
  );

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
          {LogoIcon}
        </Link>
      );
    }
    return (
      <div
        className={`frame-logo ${className}`}
        style={{ display: "inline-flex", alignItems: "center", ...style }}
        {...props}
      >
        {LogoIcon}
      </div>
    );
  }

  const content = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${currentSize.gap}px`,
        lineHeight: 1,
      }}
    >
      {LogoIcon}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
              fontSize: currentSize.font,
              fontWeight: 800,
              letterSpacing: currentSize.tracking,
              color: strokeColor,
              lineHeight: 1,
            }}
          >
            FRAME
          </span>
          {!isCompact && !isMono && (
            <span
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: cyanAccent,
                display: "inline-block",
                marginBottom: "2px",
              }}
            />
          )}
        </div>
        {subtitle && (
          <span
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
              fontSize: currentSize.subtitleFont,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-secondary, #A3A3A3)",
              marginTop: "4px",
              lineHeight: 1,
            }}
          >
            {subtitle}
          </span>
        )}
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
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`frame-logo ${className}`}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
      {...props}
    >
      {content}
    </div>
  );
}
