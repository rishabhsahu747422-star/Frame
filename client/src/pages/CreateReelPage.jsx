import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  X,
  Film,
  AlertCircle,
  ArrowLeft,
  Play,
} from "lucide-react";
import { reelsApi } from "../api/reels.api.js";
import { useToast } from "../context/ToastContext.jsx";
import Button from "../components/common/Button.jsx";

const MAX_VIDEO_SIZE_MB = 100;

export default function CreateReelPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleVideoSelected = (file) => {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Only video files (MP4, WebM, MOV) are supported for Reels.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`Video size exceeds the ${MAX_VIDEO_SIZE_MB}MB limit.`);
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleClearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file for your Reel.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("video", videoFile);
    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    try {
      const res = await reelsApi.createReel(formData);
      showToast("Reel uploaded and published successfully!", "success");
      const newReelId = res.data?.reel?._id || res.data?._id;
      if (newReelId) {
        navigate(`/reels/${newReelId}`);
      } else {
        navigate("/reels");
      }
    } catch (err) {
      setError(err.message || "Failed to upload Reel. Please try again.");
      showToast(err.message || "Upload failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            fontSize: "0.95rem",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Create Reel
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Publish a vertical 9:16 short-form video story to the FRAME global Reel feed.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--danger-surface)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              borderRadius: "var(--radius-sm)",
              padding: "0.9rem 1.25rem",
              marginBottom: "1.75rem",
              fontSize: "0.9rem",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!videoPreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleVideoSelected(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${isDragOver ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "3.5rem 1.5rem",
                textAlign: "center",
                cursor: "pointer",
                background: isDragOver ? "var(--color-accent-soft)" : "var(--bg-surface-secondary)",
                transition: "all var(--transition-fast)",
                marginBottom: "2rem",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleVideoSelected(e.target.files[0])}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--subtle-border)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                <Film size={24} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.35rem" }}>
                Select a video file to upload
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                Vertical 9:16 aspect ratio recommended. MP4, WebM up to {MAX_VIDEO_SIZE_MB}MB.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "260px",
                  aspectRatio: "9/16",
                  background: "#000000",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
              >
                <video
                  src={videoPreview}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={handleClearVideo}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(0, 0, 0, 0.75)",
                    border: "none",
                    borderRadius: "9999px",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                  title="Remove video"
                >
                  <X size={16} />
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>
                {videoFile?.name} ({(videoFile?.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
            </div>
          )}

          {/* Caption */}
          <div style={{ marginBottom: "2.5rem" }}>
            <label
              htmlFor="reel-caption"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "var(--color-text)",
              }}
            >
              Reel Description / Caption
            </label>
            <textarea
              id="reel-caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add context, sound references, or behind-the-scenes thoughts..."
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting || !videoFile}
            >
              Publish Reel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
