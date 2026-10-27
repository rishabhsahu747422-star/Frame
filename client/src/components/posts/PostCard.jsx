import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  MapPin,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { postsApi } from "../../api/posts.api.js";
import Avatar from "../common/Avatar.jsx";
import MediaCarousel from "./MediaCarousel.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";

export default function PostCard({ post, onDelete, onSaveToCollection }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const isAuthor = user && post.user && (user._id === post.user._id || user._id === post.user);

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await postsApi.toggleLike(post._id);
      if (res?.data) {
        setIsLiked(res.data.isLiked);
        setLikeCount(res.data.likeCount);
      }
    } catch (err) {
      // Rollback
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      showToast(err.message || "Failed to update like", "error");
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      const res = await postsApi.toggleSave(post._id);
      if (res?.data) {
        setIsSaved(res.data.isSaved);
        showToast(res.data.isSaved ? "Saved to your private library" : "Removed from saved", "success");
      }
    } catch (err) {
      setIsSaved(previousSaved);
      showToast(err.message || "Failed to save post", "error");
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
        showToast("Link copied to clipboard", "success");
      } else {
        showToast(`Share URL: ${postUrl}`, "info");
      }
    } catch (err) {
      showToast("Could not copy link", "error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(post._id);
      showToast("Post deleted successfully", "success");
      setShowDeleteConfirm(false);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      showToast(err.message || "Failed to delete post", "error");
    } finally {
      setDeleting(false);
    }
  };

  const author = post.user || {};
  const caption = post.caption || "";
  const isLongCaption = caption.length > 120;

  return (
    <article
      className="post-card"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--subtle-border)",
        borderRadius: "var(--radius-sm)",
        marginBottom: "24px",
        overflow: "hidden",
      }}
    >
      {/* Creator Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        <Link
          to={`/profile/${author.username}`}
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <Avatar src={author.profile_pic} alt={author.fullName || author.username} size="sm" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {author.fullName || author.username}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                @{author.username}
              </span>
            </div>
            {post.location && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "0.6875rem",
                  color: "var(--text-secondary)",
                }}
              >
                <MapPin size={11} /> {post.location}
              </span>
            )}
          </div>
        </Link>

        {/* Post Options Menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Post options"
            style={{ padding: "6px", color: "var(--text-secondary)" }}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-md)",
                zIndex: 20,
                minWidth: "160px",
                padding: "4px 0",
              }}
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleShare();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  fontSize: "0.8125rem",
                  textAlign: "left",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Share2 size={14} /> Copy Link
              </button>

              {onSaveToCollection && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSaveToCollection(post._id);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.8125rem",
                    textAlign: "left",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FolderPlus size={14} /> Add to Collection
                </button>
              )}

              {isAuthor && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "0.8125rem",
                    textAlign: "left",
                    color: "var(--danger)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Trash2 size={14} /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Post Media */}
      <MediaCarousel mediaUrls={post.media_urls} alt={caption || "FRAME photograph"} />

      {/* Engagement Actions */}
      <div style={{ padding: "12px 16px 8px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={handleLike}
              aria-label={isLiked ? "Unlike post" : "Like post"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: isLiked ? "var(--brand-accent)" : "var(--text-secondary)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isLiked) e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isLiked) e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <Heart size={20} fill={isLiked ? "var(--brand-accent)" : "none"} strokeWidth={isLiked ? 2.5 : 2} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{likeCount}</span>
            </button>

            <Link
              to={`/post/${post._id}`}
              aria-label="View comments"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text-secondary)",
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <MessageCircle size={20} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {post.commentCount || 0}
              </span>
            </Link>

            <button
              onClick={handleShare}
              aria-label="Share post"
              style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <Share2 size={18} />
            </button>
          </div>

          <button
            onClick={handleSave}
            aria-label={isSaved ? "Remove from saved" : "Save post"}
            style={{
              color: isSaved ? "var(--brand-accent)" : "var(--text-secondary)",
              transition: "color var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              if (!isSaved) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!isSaved) e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Bookmark size={20} fill={isSaved ? "var(--brand-accent)" : "none"} />
          </button>
        </div>

        {/* Caption */}
        {caption && (
          <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5, marginTop: "6px" }}>
            <Link
              to={`/profile/${author.username}`}
              style={{ fontWeight: 600, marginRight: "8px" }}
            >
              {author.username}
            </Link>
            <span>
              {isLongCaption && !expandedCaption
                ? `${caption.substring(0, 110)}...`
                : caption}
            </span>
            {isLongCaption && (
              <button
                onClick={() => setExpandedCaption((prev) => !prev)}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.8125rem",
                  marginLeft: "6px",
                  fontWeight: 500,
                }}
              >
                {expandedCaption ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* Comments link */}
        <div style={{ marginTop: "8px", paddingBottom: "10px" }}>
          <Link
            to={`/post/${post._id}`}
            style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}
          >
            {post.commentCount > 0
              ? `View all ${post.commentCount} comments`
              : "Add a comment..."}
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this photograph? It will be permanently removed from FRAME."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </article>
  );
}
