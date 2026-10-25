import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Trash2,
  MapPin,
  Calendar,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { postsApi } from "../api/posts.api.js";
import { usersApi } from "../api/users.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import MediaCarousel from "../components/posts/MediaCarousel.jsx";
import CommentThread from "../components/comments/CommentThread.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    postsApi
      .getPostById(postId)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.post || res.data;
        if (!data) {
          setError("Post not found");
          return;
        }
        setPost(data);
        setIsLiked(data.isLiked || false);
        setLikesCount(data.likesCount || (data.likes ? data.likes.length : 0));
        setIsSaved(data.isSaved || false);
        setIsFollowing(data.author?.isFollowing || false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Unable to load photograph");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleLike = async () => {
    if (!currentUser) {
      showToast("Please sign in to like photographs", "info");
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      await postsApi.toggleLike(postId);
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      showToast("Could not update reaction", "error");
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      showToast("Please sign in to save photographs", "info");
      return;
    }

    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      await postsApi.toggleSave(postId);
      showToast(previousSaved ? "Removed from Saved" : "Saved to your private collection", "success");
    } catch {
      setIsSaved(previousSaved);
      showToast("Could not update bookmark", "error");
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast("Please sign in to follow photographers", "info");
      return;
    }

    const previousFollowing = isFollowing;
    setIsFollowing(!previousFollowing);

    try {
      if (previousFollowing) {
        await usersApi.unfollowUser(post.author._id);
        showToast(`Unfollowed @${post.author.username}`, "default");
      } else {
        await usersApi.followUser(post.author._id);
        showToast(`Following @${post.author.username}`, "success");
      }
    } catch {
      setIsFollowing(previousFollowing);
      showToast("Could not update follow status", "error");
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(postId);
      showToast("Photograph deleted successfully", "success");
      navigate("/home");
    } catch (err) {
      showToast(err.message || "Failed to delete post", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard", "success");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <Skeleton height="40px" width="120px" style={{ marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
          <Skeleton height="580px" borderRadius="var(--radius-lg)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Skeleton height="60px" borderRadius="var(--radius-md)" />
            <Skeleton height="150px" borderRadius="var(--radius-md)" />
            <Skeleton height="200px" borderRadius="var(--radius-md)" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem" }}>
        <ErrorState
          title="Photograph Unavailable"
          message={error || "This photograph may have been removed, made private, or does not exist."}
          actionLabel="Back to Editorial Canvas"
          onAction={() => navigate("/home")}
        />
      </div>
    );
  }

  const isOwner = currentUser?._id === post.author?._id;
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {/* Top back bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            fontSize: "0.95rem",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
          <button
            onClick={handleShare}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "9999px",
              padding: "0.5rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text)",
            }}
          >
            <Share2 size={15} />
            Share
          </button>

          {isOwner && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "9999px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  color: "var(--color-text)",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Post options"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "6px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "0.5rem 0",
                    zIndex: 20,
                    minWidth: "160px",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 1rem",
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "0.9rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Photograph
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Media Left, Editorial Details Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Media Canvas */}
        <div
          style={{
            background: "#000000",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "450px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <MediaCarousel images={post.images || []} altText={post.caption || "FRAME photograph"} />
        </div>

        {/* Editorial Details & Social Panel */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Creator Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "1.25rem",
            }}
          >
            <Link
              to={`/profile/${post.author?.username}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Avatar src={post.author?.profile_pic} name={post.author?.name || post.author?.username} size="lg" />
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: "600", lineHeight: 1.2 }}>
                  {post.author?.name || post.author?.username}
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  @{post.author?.username}
                </span>
              </div>
            </Link>

            {!isOwner && currentUser && (
              <button
                onClick={handleFollowToggle}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "9999px",
                  border: isFollowing ? "1px solid var(--color-border)" : "none",
                  background: isFollowing ? "transparent" : "var(--color-accent)",
                  color: isFollowing ? "var(--color-text)" : "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Caption & Location */}
          <div>
            {post.caption && (
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: "1.6",
                  color: "var(--color-text)",
                  marginBottom: "1rem",
                  whiteSpace: "pre-line",
                  fontFamily: "var(--font-body)",
                }}
              >
                {post.caption}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              {post.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={15} />
                  <span>{post.location}</span>
                </div>
              )}
              {formattedDate && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={15} />
                  <span>{formattedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reactions bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
              padding: "0.9rem 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <button
                onClick={handleLike}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: isLiked ? "#ef4444" : "var(--color-text)",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                }}
              >
                <Heart size={20} fill={isLiked ? "#ef4444" : "none"} strokeWidth={2} />
                <span>{likesCount}</span>
              </button>
            </div>

            <button
              onClick={handleSave}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isSaved ? "var(--color-accent)" : "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title={isSaved ? "Saved" : "Save to collection"}
            >
              <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />
              <span style={{ fontSize: "0.85rem", fontWeight: "500" }}>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div style={{ marginTop: "0.5rem" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              Discussion
            </h3>
            <CommentThread postId={postId} postOwnerId={post.author?._id} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Photograph"
        message="Are you sure you want to permanently remove this photograph from FRAME? This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        isDestructive={true}
        onConfirm={handleDeletePost}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
