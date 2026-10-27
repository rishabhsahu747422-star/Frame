import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Camera, FolderHeart, ArrowRight, Check, Compass } from "lucide-react";
import { usersApi } from "../api/users.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Button from "../components/common/Button.jsx";
import Logo from "../components/common/Logo.jsx";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [suggested, setSuggested] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    // Fetch suggested photographers for initial discovery
    usersApi
      .searchUsers("a", 1, 6)
      .then((res) => {
        const users = res.data?.users || res.data || [];
        const filtered = users.filter((u) => u._id !== currentUser?._id);
        setSuggested(filtered);
      })
      .catch(() => {});
  }, [currentUser]);

  const toggleFollow = async (user) => {
    const isFollowed = followingMap[user._id];
    setFollowingMap((prev) => ({ ...prev, [user._id]: !isFollowed }));

    try {
      if (isFollowed) {
        await usersApi.unfollowUser(user._id);
      } else {
        await usersApi.followUser(user._id);
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [user._id]: isFollowed }));
      showToast("Could not update follow status", "error");
    }
  };

  const handleFinish = () => {
    navigate("/home");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "3rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "3rem 2.5rem",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <Logo variant="icon" size="xl" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            Welcome to FRAME
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
            An editorial canvas for photographers, storytellers, and visual curators. Here is what makes FRAME distinct:
          </p>
        </div>

        {/* Feature pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
            }}
          >
            <Camera size={22} color="var(--color-accent)" style={{ marginBottom: "0.5rem" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.25rem" }}>Editorial Canvas</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
              High-resolution photography presented with restrained typography and composition.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
            }}
          >
            <FolderHeart size={22} color="var(--color-accent)" style={{ marginBottom: "0.5rem" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.25rem" }}>Private Curation</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
              Collections are private by default, allowing you to build personal visual moodboards.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
            }}
          >
            <Compass size={22} color="var(--color-accent)" style={{ marginBottom: "0.5rem" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.25rem" }}>Asymmetric Discovery</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
              Explore visual works through varied dimensions rather than uniform squares.
            </p>
          </div>
        </div>

        {/* Suggested Photographers */}
        {suggested.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Recommended Photographers to Follow</span>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "400" }}>
                Optional
              </span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {suggested.map((u) => {
                const isFollowed = followingMap[u._id];
                return (
                  <div
                    key={u._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar src={u.profile_pic} name={u.name || u.username} size="md" />
                      <div>
                        <strong style={{ fontSize: "0.9rem", display: "block" }}>{u.name || u.username}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          @{u.username}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(u)}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        border: isFollowed ? "1px solid var(--color-border)" : "none",
                        background: isFollowed ? "var(--color-surface)" : "var(--color-accent)",
                        color: isFollowed ? "var(--color-text)" : "#ffffff",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isFollowed ? (
                        <>
                          <Check size={12} /> Following
                        </>
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finish / Skip actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleFinish}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Skip for now
          </button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleFinish}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            Enter FRAME
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
