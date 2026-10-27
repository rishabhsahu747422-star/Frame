import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Grid,
  Film,
  Folder,
  Settings,
  UserCheck,
  UserPlus,
  Share2,
  Calendar,
  Lock,
  Globe,
  Camera,
} from "lucide-react";
import { usersApi } from "../api/users.api.js";
import { postsApi } from "../api/posts.api.js";
import { reelsApi } from "../api/reels.api.js";
import { collectionsApi } from "../api/collections.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import PostGrid from "../components/posts/PostGrid.jsx";
import CollectionCard from "../components/collections/CollectionCard.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isOwner =
    currentUser &&
    (currentUser.username === username || (profile && currentUser._id === profile._id));

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    usersApi
      .getUserProfile(username)
      .then((res) => {
        if (!isMounted) return;
        const u = res.user || res.data?.user || res.data;
        if (!u) {
          setError("Creator profile not found");
          return;
        }
        setProfile(u);
        setIsFollowing(u.isFollowing || false);
        setFollowersCount(u.followersCount || (u.followers ? u.followers.length : 0));
        fetchPosts(u._id);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load creator profile");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const fetchPosts = async (userId) => {
    setPostsLoading(true);
    try {
      const res = await postsApi.getUserPosts(userId);
      setPosts(res.data?.posts || res.data || []);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchReels = async (userId) => {
    if (reels.length > 0) return;
    setReelsLoading(true);
    try {
      const res = await reelsApi.getReelsByUser(userId);
      setReels(res.data?.reels || res.data || []);
    } catch {
      setReels([]);
    } finally {
      setReelsLoading(false);
    }
  };

  const fetchCollections = async () => {
    if (collections.length > 0) return;
    setCollectionsLoading(true);
    try {
      const res = await collectionsApi.getMyCollections();
      setCollections(res.data?.collections || res.data || []);
    } catch {
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    if (tab === "reels" && profile) {
      fetchReels(profile._id);
    } else if (tab === "collections") {
      fetchCollections();
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast("Please sign in to follow creators", "info");
      return;
    }

    const previousState = isFollowing;
    const previousCount = followersCount;

    setIsFollowing(!previousState);
    setFollowersCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      if (previousState) {
        await usersApi.unfollowUser(profile._id);
        showToast(`Unfollowed @${profile.username}`, "default");
      } else {
        await usersApi.followUser(profile._id);
        showToast(`Following @${profile.username}`, "success");
      }
    } catch {
      setIsFollowing(previousState);
      setFollowersCount(previousCount);
      showToast("Failed to update follow status", "error");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Profile link copied to clipboard", "success");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "3rem" }}>
          <Skeleton height="120px" width="120px" borderRadius="9999px" />
          <div style={{ flex: 1 }}>
            <Skeleton height="28px" width="220px" style={{ marginBottom: "1rem" }} />
            <Skeleton height="18px" width="340px" style={{ marginBottom: "0.5rem" }} />
            <Skeleton height="18px" width="180px" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem" }}>
        <ErrorState
          title="Creator Not Found"
          message={error || `The user @${username} does not exist or has been suspended.`}
          actionLabel="Return to Discover"
          onAction={() => navigate("/explore")}
        />
      </div>
    );
  }

  const followingCount = profile.followingCount || (profile.following ? profile.following.length : 0);
  const worksCount = posts.length || profile.postsCount || 0;

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>
      {/* Portfolio Header */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          padding: "2rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <Avatar src={profile.profile_pic} name={profile.name || profile.username} size="xxl" />
            {isOwner && (
              <Link
                to="/settings"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  background: "var(--color-accent)",
                  color: "var(--brand-accent-text)",
                  borderRadius: "var(--radius-full)",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Change Avatar"
              >
                <Camera size={14} />
              </Link>
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {profile.name || profile.username}
                </h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {isOwner ? (
                  <Link
                    to="/settings"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.5rem 1.1rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-secondary)",
                      color: "var(--color-text)",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    <Settings size={15} />
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "var(--radius-sm)",
                      border: isFollowing ? "1px solid var(--color-border)" : "none",
                      background: isFollowing ? "transparent" : "var(--color-accent)",
                      color: isFollowing ? "var(--color-text)" : "var(--brand-accent-text)",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={16} /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} /> Follow
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleShare}
                  style={{
                    padding: "0.55rem",
                    borderRadius: "9999px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Share creator profile"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  color: "var(--color-text)",
                  margin: "0.75rem 0 1.25rem",
                  fontFamily: "var(--font-body)",
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: "2rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{worksCount}</span>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginLeft: "6px" }}>
                  Works
                </span>
              </div>
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{followersCount}</span>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginLeft: "6px" }}>
                  Followers
                </span>
              </div>
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{followingCount}</span>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginLeft: "6px" }}>
                  Following
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2.5rem",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => handleTabSelect("posts")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "posts" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            padding: "0.75rem 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: activeTab === "posts" ? "var(--brand-accent)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "posts" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <Grid size={18} />
          Photographs
        </button>

        <button
          onClick={() => handleTabSelect("reels")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "reels" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            padding: "0.75rem 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: activeTab === "reels" ? "var(--brand-accent)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "reels" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <Film size={18} />
          Reels
        </button>

        {isOwner && (
          <button
            onClick={() => handleTabSelect("collections")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "collections" ? "2px solid var(--brand-accent)" : "2px solid transparent",
              padding: "0.75rem 0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: activeTab === "collections" ? "var(--brand-accent)" : "var(--color-text-secondary)",
              fontWeight: activeTab === "collections" ? "600" : "500",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <Folder size={18} />
            Collections
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "posts" && (
        <div>
          {postsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <Skeleton height="260px" borderRadius="var(--radius-md)" />
              <Skeleton height="260px" borderRadius="var(--radius-md)" />
              <Skeleton height="260px" borderRadius="var(--radius-md)" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="No photographs published yet"
              description={
                isOwner
                  ? "Publish your first high-resolution editorial photograph to your portfolio."
                  : `@${profile.username} hasn't published any photographs yet.`
              }
              actionLabel={isOwner ? "Create Photograph" : undefined}
              onAction={isOwner ? () => navigate("/create") : undefined}
            />
          ) : (
            <PostGrid posts={posts} />
          )}
        </div>
      )}

      {activeTab === "reels" && (
        <div>
          {reelsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              <Skeleton height="340px" borderRadius="var(--radius-md)" />
              <Skeleton height="340px" borderRadius="var(--radius-md)" />
              <Skeleton height="340px" borderRadius="var(--radius-md)" />
            </div>
          ) : reels.length === 0 ? (
            <EmptyState
              title="No reels published yet"
              description={
                isOwner
                  ? "Share vertical video stories and behind-the-scenes moments."
                  : `@${profile.username} hasn't uploaded any reels.`
              }
              actionLabel={isOwner ? "Create Reel" : undefined}
              onAction={isOwner ? () => navigate("/create/reel") : undefined}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {reels.map((r) => (
                <Link
                  key={r._id}
                  to={`/reels/${r._id}`}
                  style={{
                    position: "relative",
                    aspectRatio: "9/16",
                    background: "#000000",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    textDecoration: "none",
                  }}
                >
                  {(r.media_url || r.videoUrl) ? (
                    <video
                      src={r.media_url || r.videoUrl}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                      preload="metadata"
                    />
                  ) : null}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "1rem",
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                      color: "#ffffff",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                    >
                      {r.caption || "Reel"}
                    </p>
                    <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                      {r.viewsCount || 0} views • {r.likesCount || 0} likes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "collections" && isOwner && (
        <div>
          {collectionsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
              <Skeleton height="200px" borderRadius="var(--radius-md)" />
              <Skeleton height="200px" borderRadius="var(--radius-md)" />
            </div>
          ) : collections.length === 0 ? (
            <EmptyState
              title="No collections created"
              description="Organize your visual inspirations into private or public curated collections."
              actionLabel="Go to Collections"
              onAction={() => navigate("/collections")}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {collections.map((c) => (
                <CollectionCard key={c._id} collection={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
