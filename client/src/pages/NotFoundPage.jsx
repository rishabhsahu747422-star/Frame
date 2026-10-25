import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import Button from "../components/common/Button.jsx";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "480px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "6rem",
            fontWeight: "800",
            lineHeight: 1,
            color: "var(--color-accent)",
            display: "block",
            marginBottom: "1rem",
            opacity: 0.85,
          }}
        >
          404
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: "700",
            marginBottom: "0.75rem",
          }}
        >
          Frame Not Found
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          The page, photograph, or creator profile you are looking for does not exist, has been removed, or is currently private.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>

          <Link to="/home">
            <Button
              variant="primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Compass size={16} />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
