import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Compass, Heart, MessageCircle } from "lucide-react";
import { postsApi } from "../api/posts.api.js";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Button from "../components/common/Button.jsx";

export default function ExplorePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchExplorePosts = async (targetPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await postsApi.getFeed(targetPage, 16);
      if (res?.data) {
        setPosts((prev) => (append ? [...prev, ...res.data] : res.data));
        setHasNextPage(res.meta?.hasNextPage || false);
        setPage(targetPage);
      }
    } catch (err) {
      console.error("Explore error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchExplorePosts(1, false);
  }, []);

  return (
    <div className="explore-page">
      {/* Search & Discovery Header */}
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>
            Visual Discovery
          </h2>
          <span className="editorial-tagline">Curated Showcase</span>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Explore asymmetric photographic narratives and discover new visual storytellers.
        </p>

        {/* Search Bar Link Trigger */}
        <div
          onClick={() => navigate("/search")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--subtle-border)",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            color: "var(--text-secondary)",
            transition: "border-color var(--transition-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--subtle-border)")}
        >
          <Search size={18} color="var(--brand-accent)" />
          <span style={{ fontSize: "0.875rem" }}>
            Search photographers, captions, or aesthetics...
          </span>
        </div>
      </header>

      {/* Asymmetric / Masonry Discovery Gallery */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              height={i % 3 === 0 ? "320px" : i % 2 === 0 ? "240px" : "200px"}
              borderRadius="var(--radius-sm)"
            />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div
            className="explore-masonry"
            style={{
              columns: "3 220px",
              columnGap: "14px",
              width: "100%",
            }}
          >
            {posts.map((post, idx) => {
              const coverUrl = post.media_urls?.[0] || "";
              // Editorial varied height proportion
              const heights = ["220px", "300px", "260px", "340px", "240px"];
              const assignedHeight = heights[idx % heights.length];

              return (
                <Link
                  key={post._id}
                  to={`/post/${post._id}`}
                  style={{
                    display: "block",
                    breakInside: "avoid",
                    marginBottom: "14px",
                    position: "relative",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    backgroundColor: "var(--muted-surface)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <img
                    src={coverUrl}
                    alt={post.caption || "FRAME discovery photograph"}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: assignedHeight,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  {/* Hover Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.45)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "14px",
                      color: "#FFFFFF",
                      opacity: 0,
                      transition: "opacity var(--transition-fast)",
                      backdropFilter: "blur(2px)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      @{post.user?.username || "creator"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", fontWeight: 600 }}>
                        <Heart size={16} fill="#FFFFFF" />
                        <span>{post.likeCount || 0}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", fontWeight: 600 }}>
                        <MessageCircle size={16} fill="#FFFFFF" />
                        <span>{post.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {hasNextPage && (
            <div style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                variant="secondary"
                size="md"
                loading={loadingMore}
                onClick={() => fetchExplorePosts(page + 1, true)}
              >
                Discover more work
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Compass}
          title="No discovery works found"
          description="New photographic series will be featured here as creators publish."
        />
      )}
    </div>
  );
}
