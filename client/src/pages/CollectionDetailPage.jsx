import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Globe,
  Edit2,
  Trash2,
  X,
  Share2,
} from "lucide-react";
import { collectionsApi } from "../api/collections.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PostGrid from "../components/posts/PostGrid.jsx";
import CollectionEditorModal from "../components/collections/CollectionEditorModal.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import Button from "../components/common/Button.jsx";

export default function CollectionDetailPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionsApi.getCollectionById(collectionId);
      const data = res.data?.collection || res.data;
      if (!data) {
        setError("Collection not found");
        return;
      }
      setCollection(data);
    } catch (err) {
      setError(err.message || "Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const isOwner = currentUser && collection && currentUser._id === (collection.user?._id || collection.user);

  const handleDeleteCollection = async () => {
    setDeleting(true);
    try {
      await collectionsApi.deleteCollection(collectionId);
      showToast("Collection deleted", "success");
      navigate("/collections");
    } catch (err) {
      showToast(err.message || "Failed to delete collection", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemovePost = async (postId) => {
    try {
      await collectionsApi.removePost(collectionId, postId);
      setCollection((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => (p._id || p) !== postId),
      }));
      showToast("Photograph removed from collection", "default");
    } catch (err) {
      showToast(err.message || "Could not remove photograph", "error");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Collection link copied to clipboard", "success");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <Skeleton height="35px" width="100px" style={{ marginBottom: "1.5rem" }} />
        <Skeleton height="160px" borderRadius="var(--radius-lg)" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
          <Skeleton height="260px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem" }}>
        <ErrorState
          title="Collection Unavailable"
          message={error || "This collection is private or has been removed."}
          actionLabel="Back to Collections"
          onAction={() => navigate("/collections")}
        />
      </div>
    );
  }

  const posts = collection.posts || [];

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* Top back button */}
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

      {/* Collection Header Card */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "9999px",
                  background: collection.isPublic ? "rgba(101, 88, 211, 0.1)" : "var(--color-border)",
                  color: collection.isPublic ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}
              >
                {collection.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                {collection.isPublic ? "Public Collection" : "Private Collection"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                • {posts.length} {posts.length === 1 ? "work" : "works"}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.85rem",
                fontWeight: "700",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              {collection.title || collection.name}
            </h1>

            {collection.description && (
              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  color: "var(--color-text-secondary)",
                  maxWidth: "600px",
                }}
              >
                {collection.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={handleShare}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.5rem 0.9rem",
                borderRadius: "9999px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <Share2 size={15} />
              Share
            </button>

            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Edit2 size={14} />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Photographs Grid */}
      {posts.length === 0 ? (
        <EmptyState
          title="Empty Collection"
          description="You haven't saved any photographs to this collection yet. Browse the Editorial Canvas or Explore to curate works."
          actionLabel="Explore Photographs"
          onAction={() => navigate("/explore")}
        />
      ) : (
        <PostGrid posts={posts} />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <CollectionEditorModal
          isOpen={showEditModal}
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setCollection((prev) => ({ ...prev, ...updated }));
            setShowEditModal(false);
            showToast("Collection updated", "success");
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? The original photographs will remain on FRAME."
        confirmLabel={deleting ? "Deleting..." : "Delete Collection"}
        isDestructive={true}
        onConfirm={handleDeleteCollection}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
