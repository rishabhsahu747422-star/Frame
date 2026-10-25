import React, { useEffect, useState, useCallback } from "react";
import { Compass, Sparkles, Users } from "lucide-react";
import { postsApi } from "../api/posts.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PostCard from "../components/posts/PostCard.jsx";
import StoryTray from "../components/stories/StoryTray.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Button from "../components/common/Button.jsx";
import CollectionEditorModal from "../components/collections/CollectionEditorModal.jsx";
import { collectionsApi } from "../api/collections.api.js";
import { useToast } from "../context/ToastContext.jsx";

export default function HomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("for-you"); // 'for-you' | 'following'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Collection picker state
  const [targetPostForCollection, setTargetPostForCollection] = useState(null);
  const [userCollections, setUserCollections] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const fetchFeed = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const fetcher =
          activeTab === "following"
            ? postsApi.getFollowingFeed
            : postsApi.getFeed;

        const res = await fetcher(targetPage, 10);
        if (res?.data) {
          setPosts((prev) => (append ? [...prev, ...res.data] : res.data));
          setHasNextPage(res.meta?.hasNextPage || false);
          setPage(targetPage);
        }
      } catch (err) {
        console.error("Feed error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  const handleSaveToCollection = async (postId) => {
    try {
      const res = await collectionsApi.getMyCollections();
      if (res?.data && res.data.length > 0) {
        setUserCollections(res.data);
        setTargetPostForCollection(postId);
      } else {
        // No collections yet: prompt create new collection
        setShowCollectionModal(true);
      }
    } catch (err) {
      showToast("Could not load collections", "error");
    }
  };

  const addPostToSelectedCollection = async (collectionId) => {
    try {
      await collectionsApi.addPost(collectionId, targetPostForCollection);
      showToast("Added to collection", "success");
      setTargetPostForCollection(null);
    } catch (err) {
      showToast(err.message || "Failed to add to collection", "error");
    }
  };

  return (
    <div className="home-editorial-canvas">
      {/* Editorial Canvas Header */}
      <header style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Editorial Canvas
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          A curated perspective of contemporary photography and visual culture.
        </p>
      </header>

      {/* Active Stories Tray */}
      <StoryTray />

      {/* Feed Tabs: For You vs Following */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--subtle-border)",
          marginBottom: "24px",
          gap: "24px",
        }}
      >
        <button
          onClick={() => setActiveTab("for-you")}
          style={{
            padding: "10px 4px",
            fontSize: "0.875rem",
            fontWeight: activeTab === "for-you" ? 600 : 500,
            color: activeTab === "for-you" ? "var(--brand-accent)" : "var(--text-secondary)",
            borderBottom: activeTab === "for-you" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all var(--transition-fast)",
          }}
        >
          <Sparkles size={16} /> For You
        </button>

        {user && (
          <button
            onClick={() => setActiveTab("following")}
            style={{
              padding: "10px 4px",
              fontSize: "0.875rem",
              fontWeight: activeTab === "following" ? 600 : 500,
              color: activeTab === "following" ? "var(--brand-accent)" : "var(--text-secondary)",
              borderBottom: activeTab === "following" ? "2px solid var(--brand-accent)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all var(--transition-fast)",
            }}
          >
            <Users size={16} /> Following
          </button>
        )}
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ backgroundColor: "var(--bg-surface)", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
              <Skeleton width="36px" height="36px" borderRadius="var(--radius-full)" />
              <Skeleton width="140px" height="16px" />
            </div>
            <Skeleton width="100%" height="340px" borderRadius="var(--radius-sm)" />
          </div>
          <div style={{ backgroundColor: "var(--bg-surface)", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
              <Skeleton width="36px" height="36px" borderRadius="var(--radius-full)" />
              <Skeleton width="140px" height="16px" />
            </div>
            <Skeleton width="100%" height="340px" borderRadius="var(--radius-sm)" />
          </div>
        </div>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
              onSaveToCollection={handleSaveToCollection}
            />
          ))}

          {hasNextPage && (
            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <Button
                variant="secondary"
                size="md"
                loading={loadingMore}
                onClick={() => fetchFeed(page + 1, true)}
              >
                Load more photographs
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title={activeTab === "following" ? "No posts from creators you follow" : "No posts published yet"}
          description={
            activeTab === "following"
              ? "Follow inspiring visual artists in Explore to curate your daily feed."
              : "Be among the first creators to publish a visual story on FRAME."
          }
          actionLabel="Explore Visual Artists"
          onAction={() => setActiveTab("for-you")}
        />
      )}

      {/* Add to Collection Modal Selector */}
      {targetPostForCollection && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--overlay-bg)",
            zIndex: 9600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetPostForCollection(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
            }}
          >
            <h4 style={{ fontFamily: "var(--font-display)", marginBottom: "12px", fontSize: "1rem" }}>
              Select a Collection
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {userCollections.map((col) => (
                <button
                  key={col._id}
                  onClick={() => addPostToSelectedCollection(col._id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--subtle-border)",
                    backgroundColor: "var(--bg-surface)",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--muted-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
                >
                  {col.title} ({col.postCount || 0})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTargetPostForCollection(null);
                  setShowCollectionModal(true);
                }}
              >
                + New Collection
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTargetPostForCollection(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Editor Modal */}
      <CollectionEditorModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onSaved={() => showToast("Collection ready. You can now add posts to it.", "success")}
      />
    </div>
  );
}
