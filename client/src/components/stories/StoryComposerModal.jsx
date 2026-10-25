import React, { useState, useRef } from "react";
import { X, Upload, Film, Image as ImageIcon } from "lucide-react";
import { storiesApi } from "../../api/stories.api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../common/Button.jsx";

export default function StoryComposerModal({ isOpen, onClose, onStoryCreated }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      showToast("Please select an image or video file", "error");
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      showToast("Image size cannot exceed 10MB", "error");
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      showToast("Video size cannot exceed 50MB", "error");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await storiesApi.createStory(formData);
      showToast("Story shared! Active for 24 hours.", "success");
      if (onStoryCreated) onStoryCreated(res?.story);
      handleClose();
    } catch (err) {
      showToast(err.message || "Failed to publish story", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--overlay-bg)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) handleClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--subtle-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-overlay)",
          padding: "24px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600 }}>
            Create New Story
          </h3>
          <button
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close"
            style={{ color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Media picker / preview */}
        {previewUrl ? (
          <div style={{ position: "relative", width: "100%", height: "300px", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "#000", marginBottom: "16px" }}>
            {selectedFile.type.startsWith("video/") ? (
              <video src={previewUrl} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <img src={previewUrl} alt="Story preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              aria-label="Choose different media"
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "#FFFFFF",
                padding: "6px",
                borderRadius: "var(--radius-full)",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              height: "220px",
              border: "2px dashed var(--subtle-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: "16px",
              backgroundColor: "var(--muted-surface)",
              color: "var(--text-secondary)",
              transition: "border-color var(--transition-fast)",
            }}
          >
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", color: "var(--brand-accent)" }}>
              <ImageIcon size={28} />
              <Film size={28} />
            </div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Select a photo or video
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              JPEG, PNG, WebP up to 10MB &bull; MP4 up to 50MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Add an optional caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={uploading}
            style={{
              width: "100%",
              height: "40px",
              padding: "0 12px",
              backgroundColor: "var(--muted-surface)",
              border: "1px solid var(--subtle-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button variant="secondary" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={uploading}
            disabled={!selectedFile || uploading}
            onClick={handleSubmit}
            icon={Upload}
          >
            Share Story
          </Button>
        </div>
      </div>
    </div>
  );
}
