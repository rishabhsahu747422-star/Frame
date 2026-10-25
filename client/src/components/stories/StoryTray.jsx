import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { storiesApi } from "../../api/stories.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../common/Avatar.jsx";
import StoryViewerModal from "./StoryViewerModal.jsx";
import StoryComposerModal from "./StoryComposerModal.jsx";

export default function StoryTray() {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const fetchActiveStories = async () => {
    try {
      const res = await storiesApi.getStories();
      if (res?.data) {
        setGroupedStories(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch stories:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStories();
  }, []);

  return (
    <section
      aria-label="Stories"
      className="story-tray"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "18px",
        padding: "16px 8px 20px 8px",
        overflowX: "auto",
        scrollbarWidth: "none",
        width: "100%",
        marginBottom: "16px",
      }}
    >
      {/* Current User: Add Story Item */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => setIsComposerOpen(true)}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              padding: "2px",
              borderRadius: "var(--radius-full)",
              border: "2px dashed var(--brand-accent)",
            }}
          >
            <Avatar src={user?.profile_pic} alt="Add Story" size="lg" />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "2px",
              right: "2px",
              backgroundColor: "var(--brand-accent)",
              color: "#FFFFFF",
              width: "20px",
              height: "20px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-surface)",
            }}
          >
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            maxWidth: "68px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Your Story
        </span>
      </div>

      {/* Followed Creators with Active Stories */}
      {groupedStories.map((group) => {
        const creator = group.user || {};
        const hasUnviewed = group.hasUnviewedStories;

        return (
          <div
            key={creator._id}
            onClick={() => setActiveViewerGroup(group)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                padding: "2.5px",
                borderRadius: "var(--radius-full)",
                background: hasUnviewed
                  ? "linear-gradient(45deg, #FF6369, var(--brand-accent), #B5A9FF)"
                  : "var(--subtle-border)",
                boxShadow: hasUnviewed ? "var(--shadow-sm)" : "none",
                transition: "transform var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div
                style={{
                  padding: "2px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <Avatar src={creator.profile_pic} alt={creator.username} size="lg" />
              </div>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: hasUnviewed ? 600 : 400,
                color: hasUnviewed ? "var(--text-primary)" : "var(--text-secondary)",
                maxWidth: "68px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {creator.username}
            </span>
          </div>
        );
      })}

      {/* Story Viewer Modal */}
      {activeViewerGroup && (
        <StoryViewerModal
          creatorGroup={activeViewerGroup}
          onClose={() => {
            setActiveViewerGroup(null);
            fetchActiveStories(); // Refresh seen states
          }}
          onStoryDeleted={() => fetchActiveStories()}
        />
      )}

      {/* Story Composer Modal */}
      <StoryComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onStoryCreated={() => fetchActiveStories()}
      />
    </section>
  );
}
