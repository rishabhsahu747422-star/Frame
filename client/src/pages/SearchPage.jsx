import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, X, Clock, UserCheck, UserPlus, Image as ImageIcon } from "lucide-react";
import { usersApi } from "../api/users.api.js";
import { postsApi } from "../api/posts.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import PostGrid from "../components/posts/PostGrid.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";

const RECENT_SEARCHES_KEY = "frame_recent_searches";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const tabParam = searchParams.get("tab") || "creators";

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [creators, setCreators] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const debounceTimer = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // Ignore local storage error
    }
  }, []);

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  const removeRecentSearch = (itemToRemove, e) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore local storage error
    }
  };

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!query.trim()) {
      setCreators([]);
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const [creatorsRes, postsRes] = await Promise.allSettled([
          usersApi.searchUsers(query),
          postsApi.getFeed(1, 24),
        ]);

        if (creatorsRes.status === "fulfilled" && creatorsRes.value?.data) {
          setCreators(creatorsRes.value.data.users || creatorsRes.value.data || []);
        } else {
          setCreators([]);
        }

        if (postsRes.status === "fulfilled" && postsRes.value?.data) {
          const allPosts = postsRes.value.data.posts || [];
          const lower = query.toLowerCase();
          const filtered = allPosts.filter(
            (p) =>
              p.caption?.toLowerCase().includes(lower) ||
              p.location?.toLowerCase().includes(lower) ||
              p.author?.username?.toLowerCase().includes(lower) ||
              p.author?.name?.toLowerCase().includes(lower)
          );
          setPosts(filtered);
        } else {
          setPosts([]);
        }
      } catch (err) {
        showToast("Error searching. Please check your connection.", "error");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      setSearchParams({ q: query, tab: activeTab });
    }
  };

  const handleSelectRecent = (item) => {
    setQuery(item);
    saveRecentSearch(item);
    setSearchParams({ q: item, tab: activeTab });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (query.trim()) {
      setSearchParams({ q: query, tab });
    }
  };

  const handleFollowToggle = async (creator) => {
    if (!currentUser) {
      showToast("Please sign in to follow photographers", "info");
      return;
    }
    const isFollowing = creator.isFollowing;
    setCreators((prev) =>
      prev.map((c) =>
        c._id === creator._id
          ? {
              ...c,
              isFollowing: !isFollowing,
              followersCount: (c.followersCount || 0) + (isFollowing ? -1 : 1),
            }
          : c
      )
    );

    try {
      if (isFollowing) {
        await usersApi.unfollowUser(creator._id);
        showToast(`Unfollowed @${creator.username}`, "default");
      } else {
        await usersApi.followUser(creator._id);
        showToast(`Following @${creator.username}`, "success");
      }
    } catch (err) {
      // rollback
      setCreators((prev) =>
        prev.map((c) =>
          c._id === creator._id
            ? {
                ...c,
                isFollowing,
                followersCount: (c.followersCount || 0) + (isFollowing ? 1 : -1),
              }
            : c
        )
      );
      showToast("Failed to update follow status", "error");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
          }}
        >
          Explore & Search
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
          Discover visual storytellers, emerging editorial photographers, and curated frames.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "9999px",
            padding: "0.5rem 1.25rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <SearchIcon size={20} style={{ color: "var(--color-text-secondary)", marginRight: "0.75rem", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username, creator name, theme, or location..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text)",
              fontSize: "1rem",
              fontFamily: "var(--font-body)",
            }}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCreators([]);
                setPosts([]);
                setSearchParams({});
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "var(--color-text-secondary)",
              }}
              aria-label="Clear search input"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Recent Searches (when query is empty) */}
      {!query.trim() && recentSearches.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)" }}>
              <Clock size={16} />
              <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Recent Searches
              </span>
            </div>
            <button
              onClick={clearAllRecent}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Clear all
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {recentSearches.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectRecent(item)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "9999px",
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: "var(--color-text)",
                }}
              >
                <span>{item}</span>
                <span
                  onClick={(e) => removeRecentSearch(item, e)}
                  style={{ display: "flex", alignItems: "center", color: "var(--color-text-secondary)" }}
                >
                  <X size={14} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {query.trim() && (
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "2rem",
          }}
        >
          <button
            onClick={() => handleTabChange("creators")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "creators" ? "2px solid var(--brand-accent)" : "2px solid transparent",
              padding: "0.75rem 0.25rem",
              fontWeight: activeTab === "creators" ? "600" : "400",
              color: activeTab === "creators" ? "var(--brand-accent)" : "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all var(--transition-fast)",
            }}
          >
            Photographers ({loading ? "..." : creators.length})
          </button>
          <button
            onClick={() => handleTabChange("posts")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "posts" ? "2px solid var(--brand-accent)" : "2px solid transparent",
              padding: "0.75rem 0.25rem",
              fontWeight: activeTab === "posts" ? "600" : "400",
              color: activeTab === "posts" ? "var(--brand-accent)" : "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all var(--transition-fast)",
            }}
          >
            Visual Works ({loading ? "..." : posts.length})
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Skeleton height="70px" borderRadius="var(--radius-md)" />
          <Skeleton height="70px" borderRadius="var(--radius-md)" />
          <Skeleton height="70px" borderRadius="var(--radius-md)" />
        </div>
      )}

      {/* Results: Photographers */}
      {!loading && query.trim() && activeTab === "creators" && (
        <div>
          {creators.length === 0 ? (
            <EmptyState
              title="No photographers found"
              description={`We couldn't find any creator profiles matching "${query}". Try searching by another handle or name.`}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {creators.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Link
                    to={`/profile/${c.username}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      textDecoration: "none",
                      color: "inherit",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Avatar src={c.profile_pic} name={c.name || c.username} size="lg" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: "600", fontSize: "1rem" }}>{c.name || c.username}</span>
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                          @{c.username}
                        </span>
                      </div>
                      {c.bio && (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-text-secondary)",
                            marginTop: "0.25rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "500px",
                          }}
                        >
                          {c.bio}
                        </p>
                      )}
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        {c.followersCount || 0} followers • {c.postsCount || 0} works
                      </div>
                    </div>
                  </Link>

                  {currentUser?._id !== c._id && (
                    <button
                      onClick={() => handleFollowToggle(c)}
                      style={{
                        padding: "0.45rem 1rem",
                        borderRadius: "9999px",
                        border: c.isFollowing ? "1px solid var(--color-border)" : "none",
                        background: c.isFollowing ? "transparent" : "var(--color-accent)",
                        color: c.isFollowing ? "var(--color-text)" : "var(--brand-accent-text)",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {c.isFollowing ? (
                        <>
                          <UserCheck size={14} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results: Works / Posts */}
      {!loading && query.trim() && activeTab === "posts" && (
        <div>
          {posts.length === 0 ? (
            <EmptyState
              title="No photographs found"
              description={`No visual works match the query "${query}". Try searching for another theme or subject.`}
            />
          ) : (
            <PostGrid posts={posts} />
          )}
        </div>
      )}
    </div>
  );
}
