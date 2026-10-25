import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  X,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { postsApi } from "../api/posts.api.js";
import { useToast } from "../context/ToastContext.jsx";
import Button from "../components/common/Button.jsx";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 10;

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesSelected = (newFiles) => {
    setError(null);
    const validFiles = [];
    const validPreviews = [];

    const totalAllowed = MAX_IMAGES - files.length;
    if (totalAllowed <= 0) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images per post.`);
      return;
    }

    const filesToProcess = Array.from(newFiles).slice(0, totalAllowed);

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files (JPEG, PNG, WebP) are allowed.");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Image ${file.name} exceeds the ${MAX_IMAGE_SIZE_MB}MB size limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one photograph to publish.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }
    if (location.trim()) {
      formData.append("location", location.trim());
    }

    try {
      const res = await postsApi.createPost(formData);
      showToast("Photograph published to FRAME successfully!", "success");
      const newPostId = res.data?.post?._id || res.data?._id;
      if (newPostId) {
        navigate(`/post/${newPostId}`);
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Failed to publish photograph. Please try again.");
      showToast(err.message || "Upload failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* Back button */}
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
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
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
            Publish Photograph
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Share high-resolution editorial photography with the FRAME community. Upload up to 5 images.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid #ef4444",
              color: "#ef4444",
              borderRadius: "var(--radius-md)",
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
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? "var(--color-accent)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "3rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: isDragOver ? "var(--color-accent-soft)" : "var(--color-bg)",
              transition: "all var(--transition-fast)",
              marginBottom: "2rem",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFilesSelected(e.target.files)}
              style={{ display: "none" }}
            />
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "9999px",
                background: "var(--color-surface)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
                marginBottom: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <UploadCloud size={28} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.35rem" }}>
              Click or drag photographs to upload
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              Supports JPEG, PNG, WebP up to {MAX_IMAGE_SIZE_MB}MB each. Maximum {MAX_IMAGES} images.
            </p>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.75rem",
                }}
              >
                Selected Photographs ({previews.length}/{MAX_IMAGES})
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "1rem",
                }}
              >
                {previews.map((src, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      aspectRatio: "1/1",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        background: "rgba(0, 0, 0, 0.75)",
                        border: "none",
                        borderRadius: "9999px",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label
              htmlFor="caption"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "var(--color-text)",
              }}
            >
              Editorial Story / Caption
            </label>
            <textarea
              id="caption"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell the visual story behind this shot: camera settings, lighting, narrative inspiration..."
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

          {/* Location */}
          <div style={{ marginBottom: "2.5rem" }}>
            <label
              htmlFor="location"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "var(--color-text)",
              }}
            >
              Location (Optional)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.65rem 1rem",
              }}
            >
              <MapPin size={18} style={{ color: "var(--color-text-secondary)", marginRight: "0.5rem" }} />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kyoto, Japan or Studio 4, Brooklyn"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                }}
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || files.length === 0}
            >
              Publish to FRAME
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
