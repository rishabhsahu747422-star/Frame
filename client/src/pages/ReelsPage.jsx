import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Film,
  Sparkles,
} from "lucide-react";
import { reelsApi } from "../api/reels.api.js";
import ReelPlayer from "../components/reels/ReelPlayer.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import Button from "../components/common/Button.jsx";

export default function ReelsPage() {
  const { reelId } = useParams();
  const navigate = useNavigate();

  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadReels = async () => {
      try {
        if (reelId) {
          // If direct reel requested, fetch it first
          const singleRes = await reelsApi.getReelById(reelId);
          const single = singleRes.data?.reel || singleRes.data;
          
          // Also fetch feed to allow scrolling
          const feedRes = await reelsApi.getReels(1, 15);
          const feed = feedRes.data?.reels || feedRes.data || [];
          
          if (!isMounted) return;
          if (single) {
            const others = feed.filter((r) => r._id !== single._id);
            setReels([single, ...others]);
            setActiveIndex(0);
          } else {
            setReels(feed);
          }
        } else {
          const res = await reelsApi.getReels(1, 15);
          if (!isMounted) return;
          const feed = res.data?.reels || res.data || [];
          setReels(feed);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to load Reels feed");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReels();

    return () => {
      isMounted = false;
    };
  }, [reelId]);

  // Keyboard navigation (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (reels.length <= 1) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, reels.length]);

  const goToNext = () => {
    if (activeIndex < reels.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      if (reels[nextIdx]) {
        navigate(`/reels/${reels[nextIdx]._id}`, { replace: true });
      }
    }
  };

  const goToPrevious = () => {
    if (activeIndex > 0) {
      const prevIdx = activeIndex - 1;
      setActiveIndex(prevIdx);
      if (reels[prevIdx]) {
        navigate(`/reels/${reels[prevIdx]._id}`, { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "75vh",
          padding: "2rem 1rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <Skeleton height="700px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "0 1rem" }}>
        <ErrorState
          title="Reels Feed Unavailable"
          message={error}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem" }}>
        <EmptyState
          title="No Reels Available"
          description="Be the first creator to publish a vertical short-form story on FRAME."
          actionLabel="Create Reel"
          onAction={() => navigate("/create/reel")}
        />
      </div>
    );
  }

  const activeReel = reels[activeIndex];

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        minHeight: "calc(100vh - 120px)",
        padding: "1rem 1rem 3rem",
      }}
    >
      {/* Reel Viewing Container */}
      <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
        {activeReel && (
          <ReelPlayer reel={activeReel} isActive={true} />
        )}

        {/* Floating Navigation Controls on Desktop */}
        <div
          style={{
            position: "absolute",
            right: "-70px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 10,
          }}
          className="desktop-only"
        >
          <button
            onClick={goToPrevious}
            disabled={activeIndex === 0}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "9999px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeIndex === 0 ? "not-allowed" : "pointer",
              opacity: activeIndex === 0 ? 0.35 : 1,
              color: "var(--color-text)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            title="Previous Reel (Arrow Up)"
            aria-label="Previous Reel"
          >
            <ChevronUp size={22} />
          </button>

          <button
            onClick={goToNext}
            disabled={activeIndex === reels.length - 1}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "9999px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeIndex === reels.length - 1 ? "not-allowed" : "pointer",
              opacity: activeIndex === reels.length - 1 ? 0.35 : 1,
              color: "var(--color-text)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            title="Next Reel (Arrow Down)"
            aria-label="Next Reel"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
