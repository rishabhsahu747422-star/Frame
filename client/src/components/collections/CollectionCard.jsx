import React from "react";
import { Link } from "react-router-dom";
import { Lock, Globe, Image as ImageIcon } from "lucide-react";

export default function CollectionCard({ collection }) {
  const coverUrl =
    collection.coverImage ||
    collection.coverPost?.media_urls?.[0] ||
    "";

  return (
    <Link
      to={`/collections/${collection._id}`}
      className="collection-card"
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--subtle-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        transition: "transform var(--transition-fast), border-color var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--subtle-border)";
      }}
    >
      {/* Cover image or fallback */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "var(--muted-surface)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={collection.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <ImageIcon size={32} />
          </div>
        )}

        {/* Privacy badge */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#FFFFFF",
            padding: "4px 8px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backdropFilter: "blur(4px)",
          }}
        >
          {collection.isPublic ? <Globe size={12} /> : <Lock size={12} />}
          <span>{collection.isPublic ? "Public" : "Private"}</span>
        </div>
      </div>

      {/* Collection details */}
      <div style={{ padding: "14px 16px" }}>
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {collection.title}
        </h4>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {collection.postCount || collection.posts?.length || 0} photographs
        </p>
      </div>
    </Link>
  );
}
