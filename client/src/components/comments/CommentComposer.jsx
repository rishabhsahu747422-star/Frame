import React, { useState } from "react";
import { Send } from "lucide-react";
import { commentsApi } from "../../api/comments.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../common/Button.jsx";

export default function CommentComposer({ postId, reelId, onCommentCreated }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    if (!user) {
      showToast("Please sign in to leave a comment", "info");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { text: text.trim() };
      if (postId) payload.postId = postId;
      if (reelId) payload.reelId = reelId;

      const res = await commentsApi.createComment(payload);
      if (res?.data) {
        setText("");
        if (onCommentCreated) onCommentCreated(res.data);
      }
    } catch (err) {
      showToast(err.message || "Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 0",
      }}
    >
      <input
        type="text"
        placeholder={user ? "Add an editorial thought..." : "Sign in to comment..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!user || submitting}
        style={{
          flex: 1,
          height: "40px",
          padding: "0 14px",
          backgroundColor: "var(--muted-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--subtle-border)",
          borderRadius: "var(--radius-full)",
          fontSize: "0.875rem",
        }}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={!text.trim() || submitting}
        loading={submitting}
        style={{ borderRadius: "var(--radius-full)", width: "36px", height: "36px", padding: 0 }}
        aria-label="Post comment"
      >
        <Send size={15} />
      </Button>
    </form>
  );
}
