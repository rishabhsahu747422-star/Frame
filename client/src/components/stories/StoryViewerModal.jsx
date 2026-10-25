import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2 } from "lucide-react";
import { storiesApi } from "../../api/stories.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Avatar from "../common/Avatar.jsx";

export default function StoryViewerModal({
  creatorGroup,
  onClose,
  onStoryDeleted,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const stories = creatorGroup?.stories || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const currentStory = stories[currentIndex];
  const isOwner = user && creatorGroup?.user && user._id === creatorGroup.user._id;

  // Record view on story load
  useEffect(() => {
    if (!currentStory) return;
    const record = async () => {
      try {
        await storiesApi.recordView(currentStory._id);
      } catch (err) {
        // Silent view record
      }
    };
    record();
  }, [currentStory]);

  const goToNextStory = useCallback(() => {
    setProgress(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose(); // Finished this creator's stories
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevStory = useCallback(() => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Timer loop for story duration (5 seconds for images, video duration for videos)
  useEffect(() => {
    if (isPaused || !currentStory) return;

    if (currentStory.media_type === "video") {
      // Progress tied to video playback
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", goToNextStory);
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", goToNextStory);
      };
    } else {
      // 5 seconds progress bar for images
      const intervalMs = 50;
      const step = (intervalMs / 5000) * 100;

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            goToNextStory();
            return 0;
          }
          return prev + step;
        });
      }, intervalMs);

      return () => clearInterval(timer);
    }
  }, [currentIndex, isPaused, currentStory, goToNextStory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goToNextStory();
      if (e.key === "ArrowLeft") goToPrevStory();
      if (e.key === " ") setIsPaused((p) => !p);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNextStory, goToPrevStory]);

  if (!currentStory) return null;

  const handleDelete = async () => {
    try {
      await storiesApi.deleteStory(currentStory._id);
      showToast("Story deleted", "success");
      if (onStoryDeleted) onStoryDeleted(currentStory._id);
      goToNextStory();
    } catch (err) {
      showToast(err.message || "Failed to delete story", "error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Top Header: Progress indicators and Creator profile */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          zIndex: 20,
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Progress bars for each story */}
        <div style={{ display: "flex", gap: "4px", width: "100%" }}>
          {stories.map((story, idx) => (
            <div
              key={story._id}
              style={{
                flex: 1,
                height: "3px",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#FFFFFF",
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                  transition: idx === currentIndex ? "none" : "width var(--transition-fast)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Creator Info & Action controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar src={creatorGroup.user.profile_pic} alt={creatorGroup.user.username} size="sm" />
            <div>
              <p style={{ color: "#FFFFFF", fontSize: "0.875rem", fontWeight: 600 }}>
                {creatorGroup.user.fullName || creatorGroup.user.username}
              </p>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.6875rem" }}>
                @{creatorGroup.user.username}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              style={{ color: "#FFFFFF", padding: "6px" }}
              aria-label={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                style={{ color: "rgba(255, 255, 255, 0.8)", padding: "6px" }}
                aria-label="Delete story"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              onClick={onClose}
              style={{ color: "#FFFFFF", padding: "6px" }}
              aria-label="Close stories viewer"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Main media container */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "82vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {currentStory.media_type === "video" ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt={currentStory.caption || "FRAME Story"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}

        {/* Story caption overlay */}
        {currentStory.caption && (
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "16px",
              right: "16px",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              textAlign: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            {currentStory.caption}
          </div>
        )}
      </div>

      {/* Left / Right chevron navigation */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevStory}
          aria-label="Previous story"
          style={{
            position: "absolute",
            left: "24px",
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "12px",
            borderRadius: "var(--radius-full)",
          }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <button
        onClick={goToNextStory}
        aria-label="Next story"
        style={{
          position: "absolute",
          right: "24px",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "12px",
          borderRadius: "var(--radius-full)",
        }}
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
}
