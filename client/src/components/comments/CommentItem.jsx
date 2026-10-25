import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { commentsApi } from "../../api/comments.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Avatar from "../common/Avatar.jsx";

export default function CommentItem({ comment, postOwnerId, onDelete }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [deleting, setDeleting] = useState(false);

  const author = comment.user || {};
  const isCommentOwner = user && author._id && user._id === author._id;
  const isParentOwner = user && postOwnerId && user._id === postOwnerId;
  const canDelete = isCommentOwner || isParentOwner;

  const handleLike = async () => {
    if (!user) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await commentsApi.toggleLike(comment._id);
      if (res?.data) {
        setIsLiked(res.data.isLiked);
        setLikeCount(res.data.likeCount);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await commentsApi.deleteComment(comment._id);
      showToast("Comment removed", "success");
      if (onDelete) onDelete(comment._id);
    } catch (err) {
      showToast(err.message || "Failed to delete comment", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid var(--subtle-border)",
      }}
    >
      <Link to={`/profile/${author.username}`}>
        <Avatar src={author.profile_pic} alt={author.username} size="sm" />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <Link
            to={`/profile/${author.username}`}
            style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}
          >
            {author.username}
          </Link>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", wordBreak: "break-word" }}>
            {comment.text}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "6px" }}>
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: isLiked ? "var(--danger)" : "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            <Heart size={14} fill={isLiked ? "var(--danger)" : "none"} />
            <span>{likeCount > 0 ? likeCount : "Like"}</span>
          </button>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete comment"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
