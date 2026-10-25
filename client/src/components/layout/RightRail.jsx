import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Layers, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.api.js";
import Avatar from "../common/Avatar.jsx";
import Button from "../common/Button.jsx";

export default function RightRail() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Search popular creators or sample suggestions
        const res = await usersApi.searchUsers("a", 1, 5);
        if (isMounted && res?.data) {
          // Exclude current user
          const filtered = res.data.filter((u) => u._id !== user?._id);
          setSuggestions(filtered.slice(0, 4));
        }
      } catch (err) {
        // Silent catch for suggestions
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  const handleFollowToggle = async (targetId, isCurrentlyFollowing) => {
    try {
      if (isCurrentlyFollowing) {
        await usersApi.unfollowUser(targetId);
      } else {
        await usersApi.followUser(targetId);
      }

      setSuggestions((prev) =>
        prev.map((s) =>
          s._id === targetId ? { ...s, isFollowing: !isCurrentlyFollowing } : s
        )
      );
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  return (
    <aside
      className="app-rightrail"
      style={{
        width: "var(--right-rail-width)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        padding: "24px 20px",
        borderLeft: "1px solid var(--subtle-border)",
        backgroundColor: "var(--bg-main)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Current User Snapshot */}
      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--subtle-border)",
          }}
        >
          <Link
            to={`/profile/${user.username}`}
            style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}
          >
            <Avatar src={user.profile_pic} alt={user.fullName || user.username} size="md" />
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {user.fullName || user.username}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                @{user.username}
              </p>
            </div>
          </Link>
          <Link
            to={`/profile/${user.username}`}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--brand-accent)",
              padding: "4px 8px",
            }}
          >
            Profile
          </Link>
        </div>
      )}

      {/* Suggested Creators */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span className="editorial-tagline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="var(--brand-accent)" /> Suggested Creators
          </span>
          <Link
            to="/explore"
            style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}
          >
            See all
          </Link>
        </div>

        {suggestions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {suggestions.map((creator) => (
              <div
                key={creator._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <Link
                  to={`/profile/${creator.username}`}
                  style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}
                >
                  <Avatar src={creator.profile_pic} alt={creator.username} size="sm" />
                  <div style={{ overflow: "hidden" }}>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {creator.fullName || creator.username}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      @{creator.username}
                    </p>
                  </div>
                </Link>

                <Button
                  variant={creator.isFollowing ? "outline" : "primary"}
                  size="sm"
                  style={{ padding: "0 10px", height: "28px", fontSize: "0.75rem", flexShrink: 0 }}
                  onClick={() => handleFollowToggle(creator._id, creator.isFollowing)}
                >
                  {creator.isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Explore new visual storytellers across the network.
          </p>
        )}
      </div>

      {/* Curated Editorial Collections banner */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--subtle-border)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand-accent)" }}>
          <Layers size={18} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem" }}>
            Curated Collections
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Organize your visual inspirations into private portfolios or public editorial showcases.
        </p>
        <Link
          to="/collections"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--brand-accent)",
            marginTop: "4px",
          }}
        >
          Manage Collections <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Minimalist Editorial Footer */}
      <footer style={{ marginTop: "auto", paddingTop: "20px" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          FRAME Platform &bull; Editorial Photography &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </aside>
  );
}
