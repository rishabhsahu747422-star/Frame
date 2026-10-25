import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  Layers,
  Sparkles,
  Compass,
  Film,
  Lock,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/common/Button.jsx";

export default function LandingPage() {
  const { currentUser } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Editorial Navigation */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: "800",
            letterSpacing: "0.15em",
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          FRAME
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {currentUser ? (
            <Link to="/home">
              <Button variant="primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Enter Canvas
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                }}
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button variant="primary" size="md">
                  Join FRAME
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "4rem 2rem 5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "0.4rem 1rem",
            borderRadius: "9999px",
            background: "var(--color-accent-soft)",
            color: "var(--color-accent)",
            fontSize: "0.85rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1.75rem",
          }}
        >
          <Sparkles size={16} />
          Editorial-Meets-Social Photography
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: "800",
            lineHeight: "1.08",
            letterSpacing: "-0.03em",
            maxWidth: "960px",
            margin: "0 auto 1.5rem",
          }}
        >
          A sanctuary for photography that demands to be seen.
        </h1>

        <p
          style={{
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            color: "var(--color-text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 2.5rem",
            lineHeight: "1.6",
            fontFamily: "var(--font-body)",
          }}
        >
          FRAME replaces uniform algorithm grids with deliberate composition, high-resolution storytelling, private curation, and an editorial canvas built for true creators.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          {currentUser ? (
            <Link to="/home">
              <Button variant="primary" size="lg" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                Open Editorial Canvas
                <ArrowRight size={18} />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button variant="primary" size="lg" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Start Curating
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg">
                  Explore Public Works
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Visual Canvas Showcase */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto 6rem",
          padding: "0 2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "1.5rem",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              gridColumn: "span 7",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--color-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
              minHeight: "440px",
              position: "relative",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
              alt="Editorial Landscape"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "2rem",
                background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                color: "#ffffff",
              }}
            >
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>
                Curated Feature • Yosemite National Park
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: "700", marginTop: "4px" }}>
                Atmosphere & Horizon
              </h3>
            </div>
          </div>

          <div
            style={{
              gridColumn: "span 5",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                flex: 1,
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                position: "relative",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80"
                alt="Architectural Composition"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.25rem",
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  color: "#ffffff",
                }}
              >
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600" }}>
                  Geometric Modernism
                </h4>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                position: "relative",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
                alt="Portrait Lighting"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.25rem",
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  color: "#ffffff",
                }}
              >
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "600" }}>
                  Chiaroscuro & Tone
                </h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "5rem 2rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.25rem",
                fontWeight: "700",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              Built for Visual Precision
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
              Every surface of FRAME has been tuned to respect aspect ratios, color fidelity, and author intent.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2.5rem",
            }}
          >
            <div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <Camera size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Editorial Canvas
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                Display multi-image carousels and high-res single exposures with typography tailored for visual storytelling.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Private Curation
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                Collections are private by default. Collect inspiration without performative pressure until you decide to make it public.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <Film size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Reels & Stories
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                Vertical 9:16 cinematography and ephemeral 24-hour visual stories with strict server-side lifecycle rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          fontSize: "0.9rem",
          color: "var(--color-text-secondary)",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", color: "var(--color-text)" }}>
          FRAME V1
        </span>
        <span>© {new Date().getFullYear()} FRAME. All rights reserved.</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link to="/explore" style={{ color: "inherit", textDecoration: "none" }}>
            Explore
          </Link>
          <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>
            Sign In
          </Link>
          <Link to="/register" style={{ color: "inherit", textDecoration: "none" }}>
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
