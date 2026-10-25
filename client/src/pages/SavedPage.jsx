import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Lock } from "lucide-react";
import { postsApi } from "../api/posts.api.js";
import PostGrid from "../components/posts/PostGrid.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";

export default function SavedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsApi.getSavedPosts(1, 24);
      setPosts(res.data?.posts || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load your saved photographs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              fontWeight: "600",
              textTransform: "uppercase",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Lock size={12} />
            Private Library
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
          }}
        >
          Saved Works
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
          Your private personal archive of bookmarked visual inspiration across FRAME.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Could Not Load Saved Works"
          message={error}
          actionLabel="Retry"
          onAction={fetchSavedPosts}
        />
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <EmptyState
          title="No Saved Works Yet"
          description="When you discover photographs or stories you want to revisit, bookmark them to save them here in your private library."
          actionLabel="Explore Photographs"
          onAction={() => navigate("/explore")}
        />
      )}

      {/* Saved Posts Grid */}
      {!loading && !error && posts.length > 0 && (
        <PostGrid posts={posts} />
      )}
    </div>
  );
}
