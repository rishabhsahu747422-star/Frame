import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { commentsApi } from "../../api/comments.api.js";
import CommentItem from "./CommentItem.jsx";
import CommentComposer from "./CommentComposer.jsx";
import Skeleton from "../common/Skeleton.jsx";
import EmptyState from "../common/EmptyState.jsx";
import Button from "../common/Button.jsx";

export default function CommentThread({ postId, reelId, postOwnerId }) {
  const resourceId = postId || reelId;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComments = useCallback(
    async (targetPage = 1, append = false) => {
      if (!resourceId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await commentsApi.getComments(resourceId, targetPage, 20);
        if (res?.data) {
          setComments((prev) => (append ? [...prev, ...res.data] : res.data));
          setHasNextPage(res.meta?.hasNextPage || false);
          setPage(targetPage);
        }
      } catch (err) {
        console.error("Comments fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [resourceId]
  );

  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  const handleCommentCreated = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const handleCommentDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  return (
    <div className="comment-thread" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Scrollable comment list */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px 0" }}>
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
          </div>
        ) : comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postOwnerId={postOwnerId}
                onDelete={handleCommentDeleted}
              />
            ))}

            {hasNextPage && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={loadingMore}
                  onClick={() => fetchComments(page + 1, true)}
                >
                  Load older comments
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="Be the first to share an editorial reflection."
            style={{ padding: "32px 0", minHeight: "160px" }}
          />
        )}
      </div>

      {/* Comment composer */}
      <div style={{ borderTop: "1px solid var(--subtle-border)", marginTop: "12px", paddingTop: "8px" }}>
        <CommentComposer
          postId={postId}
          reelId={reelId}
          onCommentCreated={handleCommentCreated}
        />
      </div>
    </div>
  );
}
