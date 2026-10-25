import React from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Copy } from "lucide-react";

export default function PostGrid({ posts = [], emptyState = null }) {
  if (!posts || posts.length === 0) {
    return emptyState || null;
  }

  return (
    <div
      className="post-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {posts.map((post) => {
        const coverUrl = post.media_urls?.[0] || post.images?.[0] || "";
        const isMultiImage = (post.media_urls || post.images || []).length > 1;

        return (
          <Link
            key={post._id}
            to={`/post/${post._id}`}
            className="post-grid-item"
            style={{
              position: "relative",
              aspectRatio: "1/1",
              backgroundColor: "var(--muted-surface)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              display: "block",
            }}
          >
            <img
              src={coverUrl}
              alt={post.caption || "FRAME photograph"}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />

            {/* Multiple photos badge */}
            {isMultiImage && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "#FFFFFF",
                  padding: "4px",
                  borderRadius: "var(--radius-xs)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(2px)",
                }}
              >
                <Copy size={13} />
              </div>
            )}

            {/* Hover overlay with engagement counts */}
            <div
              className="grid-overlay"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                opacity: 0,
                transition: "opacity var(--transition-fast)",
                backdropFilter: "blur(2px)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.875rem" }}>
                <Heart size={18} fill="#FFFFFF" />
                <span>{post.likeCount || 0}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.875rem" }}>
                <MessageCircle size={18} fill="#FFFFFF" />
                <span>{post.commentCount || 0}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
