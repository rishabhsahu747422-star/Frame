import React, { useState } from "react";
import { X, Lock, Globe } from "lucide-react";
import { collectionsApi } from "../../api/collections.api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../common/Button.jsx";
import InputField from "../common/InputField.jsx";

export default function CollectionEditorModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  onSuccess,
}) {
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        isPublic,
      };

      let res;
      if (initialData?._id) {
        res = await collectionsApi.updateCollection(initialData._id, payload);
        showToast("Collection updated", "success");
      } else {
        res = await collectionsApi.createCollection(payload);
        showToast("Collection created", "success");
      }

      const callback = onSaved || onSuccess;
      if (callback) callback(res?.data || res);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to save collection", "error");
    } finally {
      setSaving(false);
    }
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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-overlay)",
          padding: "24px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600 }}>
            {initialData ? "Edit Collection" : "New Curated Collection"}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            style={{ color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <InputField
            id="collection-title"
            label="Collection Title"
            placeholder="e.g. Modernist Geometries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />

          <InputField
            id="collection-desc"
            label="Description (Optional)"
            placeholder="Describe the editorial mood or theme..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            isTextArea
            rows={2}
            disabled={saving}
          />

          {/* Visibility Selection */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "8px" }}>
              Visibility
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${!isPublic ? "var(--brand-accent)" : "var(--subtle-border)"}`,
                  backgroundColor: !isPublic ? "var(--soft-accent-surface)" : "var(--bg-surface)",
                  color: !isPublic ? "var(--brand-accent)" : "var(--text-primary)",
                  textAlign: "left",
                }}
              >
                <Lock size={18} />
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Private</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Only you can view</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${isPublic ? "var(--brand-accent)" : "var(--subtle-border)"}`,
                  backgroundColor: isPublic ? "var(--soft-accent-surface)" : "var(--bg-surface)",
                  color: isPublic ? "var(--brand-accent)" : "var(--text-primary)",
                  textAlign: "left",
                }}
              >
                <Globe size={18} />
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Public</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Anyone can view</p>
                </div>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!title.trim() || saving}>
              {initialData ? "Save Changes" : "Create Collection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
