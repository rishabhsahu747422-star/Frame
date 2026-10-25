import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Eye,
  X,
} from "lucide-react";
import { reelsApi } from "../../api/reels.api.js";
import { usersApi } from "../../api/users.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Avatar from "../common/Avatar.jsx";
import Button from "../common/Button.jsx";
import CommentThread from "../comments/CommentThread.jsx";

export default function ReelPlayer({ reel, isActive = true }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(reel.isLiked || false);
  const [likeCount, setLikeCount] = useState(reel.likeCount || 0);
  const [isFollowing, setIsFollowing] = useState(reel.user?.isFollowing || false);
  const [showComments, setShowComments] = useState(false);
  const [viewCount, setViewCount] = useState(reel.viewCount || 0);

  const author = reel.user || {};
  const isMe = user && author._id && user._id === author._id;

  // Auto-play / pause based on active visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => {
        setIsPlaying(true);
        // Record view
        reelsApi.recordView(reel._id).then((res) => {
          if (res?.data?.viewCount) setViewCount(res.data.viewCount);
        }).catch(() => {});
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel._id]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await reelsApi.toggleLike(reel._id);
      if (res?.data) {
        setIsLiked(res.data.isLiked);
        setLikeCount(res.data.likeCount);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }

    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);

    try {
      if (prevFollowing) {
        await usersApi.unfollowUser(author._id);
      } else {
        await usersApi.followUser(author._id);
      }
    } catch (err) {
      setIsFollowing(prevFollowing);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const reelUrl = `${window.location.origin}/reels/${reel._id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(reelUrl);
        showToast("Reel link copied", "success");
      } else {
        showToast(`Share URL: ${reelUrl}`, "info");
      }
    } catch (err) {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <div
      className="reel-player-container"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        height: "85vh",
        maxHeight: "780px",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backgroundColor: "#000000",
        boxShadow: "var(--shadow-lg)",
        scrollSnapAlign: "start",
        margin: "0 auto 32px auto",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={reel.media_url}
        loop
        playsInline
        muted={isMuted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Play/Pause indicator icon */}
      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#FFFFFF",
            }}
          >
            <Play size={36} fill="#FFFFFF" />
          </div>
        </div>
      )}

      {/* Sound toggle button */}
      <button
        onClick={toggleSound}
        aria-label={isMuted ? "Unmute" : "Mute"}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "8px",
          borderRadius: "var(--radius-full)",
          backdropFilter: "blur(4px)",
          zIndex: 10,
        }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Right Action Rail */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          right: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          zIndex: 10,
        }}
      >
        {/* Like action */}
        <button
          onClick={handleLike}
          aria-label={isLiked ? "Unlike Reel" : "Like Reel"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: isLiked ? "var(--danger)" : "#FFFFFF",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
            }}
          >
            <Heart size={24} fill={isLiked ? "var(--danger)" : "none"} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#FFFFFF" }}>
            {likeCount}
          </span>
        </button>

        {/* Comment action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(true);
          }}
          aria-label="View comments"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
            }}
          >
            <MessageCircle size={24} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#FFFFFF" }}>
            {reel.commentCount || 0}
          </span>
        </button>

        {/* Share action */}
        <button
          onClick={handleShare}
          aria-label="Share Reel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
            }}
          >
            <Share2 size={22} />
          </div>
        </button>

        {/* View count indicator */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <Eye size={18} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 500 }}>
            {viewCount}
          </span>
        </div>
      </div>

      {/* Creator Info & Caption overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: "60px",
          padding: "20px 16px",
          background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
          color: "#FFFFFF",
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Link to={`/profile/${author.username}`}>
            <Avatar src={author.profile_pic} alt={author.username} size="sm" />
          </Link>
          <Link
            to={`/profile/${author.username}`}
            style={{ fontWeight: 600, fontSize: "0.875rem", color: "#FFFFFF" }}
          >
            @{author.username}
          </Link>

          {!isMe && (
            <Button
              variant={isFollowing ? "outline" : "primary"}
              size="sm"
              style={{
                height: "26px",
                padding: "0 10px",
                fontSize: "0.6875rem",
                color: isFollowing ? "#FFFFFF" : undefined,
                borderColor: isFollowing ? "rgba(255,255,255,0.4)" : undefined,
              }}
              onClick={handleFollowToggle}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        {reel.caption && (
          <p style={{ fontSize: "0.8125rem", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.4 }}>
            {reel.caption}
          </p>
        )}
      </div>

      {/* Comments Drawer / Overlay */}
      {showComments && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "var(--bg-surface)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            animation: "modalFadeIn 200ms ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--subtle-border)", paddingBottom: "10px" }}>
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem" }}>
              Comments ({reel.commentCount || 0})
            </h4>
            <button
              onClick={() => setShowComments(false)}
              aria-label="Close comments"
              style={{ color: "var(--text-muted)", padding: "4px" }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <CommentThread reelId={reel._id} postOwnerId={author._id} />
          </div>
        </div>
      )}
    </div>
  );
}
