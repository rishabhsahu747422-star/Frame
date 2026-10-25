import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Circle,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { notificationsApi } from "../api/notifications.api.js";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import Button from "../components/common/Button.jsx";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications(1, 30);
      setNotifications(res.data?.notifications || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignore background read error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast("All notifications marked as read", "success");
    } catch (err) {
      showToast(err.message || "Failed to mark all as read", "error");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={16} fill="#ef4444" color="#ef4444" />;
      case "comment":
        return <MessageCircle size={16} color="var(--color-accent)" />;
      case "follow":
        return <UserPlus size={16} color="#10b981" />;
      default:
        return <Bell size={16} color="var(--color-accent)" />;
    }
  };

  const getTargetUrl = (item) => {
    if (item.post) return `/post/${item.post._id || item.post}`;
    if (item.reel) return `/reels/${item.reel._id || item.reel}`;
    if (item.sender?.username) return `/profile/${item.sender.username}`;
    return "#";
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              marginBottom: "0.25rem",
            }}
          >
            Activity & Notifications
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You're all caught up with your editorial community."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCheck size={16} />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton height="72px" borderRadius="var(--radius-md)" />
          <Skeleton height="72px" borderRadius="var(--radius-md)" />
          <Skeleton height="72px" borderRadius="var(--radius-md)" />
          <Skeleton height="72px" borderRadius="var(--radius-md)" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorState
          title="Could Not Load Notifications"
          message={error}
          actionLabel="Retry"
          onAction={fetchNotifications}
        />
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          title="No Activity Yet"
          description="When other photographers and curators like your work, leave comments, or follow you, your notifications will appear here."
        />
      )}

      {/* List */}
      {!loading && !error && notifications.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          {notifications.map((item, idx) => {
            const sender = item.sender || {};
            const isRead = item.isRead;
            const targetUrl = getTargetUrl(item);

            return (
              <div
                key={item._id || idx}
                onClick={() => {
                  if (!isRead) handleMarkAsRead(item._id);
                  if (targetUrl !== "#") navigate(targetUrl);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  borderBottom:
                    idx < notifications.length - 1 ? "1px solid var(--color-border)" : "none",
                  background: isRead ? "transparent" : "var(--color-accent-soft)",
                  cursor: "pointer",
                  transition: "background var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar src={sender.profile_pic} name={sender.name || sender.username} size="md" />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        background: "var(--color-surface)",
                        borderRadius: "9999px",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {getNotificationIcon(item.type)}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.95rem", color: "var(--color-text)", lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: "600" }}>{sender.name || sender.username || "Someone"}</strong>{" "}
                      {item.message || item.text || "interacted with your content."}
                    </p>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Recently"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                  {!isRead && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "9999px",
                        background: "var(--color-accent)",
                      }}
                      title="Unread"
                    />
                  )}
                  {item.post?.images?.[0] && (
                    <img
                      src={item.post.images[0]}
                      alt="Thumbnail"
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-sm)",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
