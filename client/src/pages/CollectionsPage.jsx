import React, { useState, useEffect } from "react";
import { Plus, Folder, Lock, Globe } from "lucide-react";
import { collectionsApi } from "../api/collections.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import CollectionCard from "../components/collections/CollectionCard.jsx";
import CollectionEditorModal from "../components/collections/CollectionEditorModal.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import Button from "../components/common/Button.jsx";

export default function CollectionsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionsApi.getMyCollections();
      setCollections(res.data?.collections || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCollectionCreated = (newCol) => {
    setCollections((prev) => [newCol, ...prev]);
    setShowCreateModal(false);
    showToast("Collection created successfully", "success");
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            Curated Collections
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Private by default. Organize and archive your visual inspirations into cohesive portfolios.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} />
          New Collection
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Skeleton height="220px" borderRadius="var(--radius-md)" />
          <Skeleton height="220px" borderRadius="var(--radius-md)" />
          <Skeleton height="220px" borderRadius="var(--radius-md)" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Could Not Load Collections"
          message={error}
          actionLabel="Retry"
          onAction={fetchCollections}
        />
      )}

      {/* Empty State */}
      {!loading && !error && collections.length === 0 && (
        <EmptyState
          title="No Collections Yet"
          description="Create your first themed visual collection to organize photographs privately or share publicly."
          actionLabel="Create Collection"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {/* Collections Grid */}
      {!loading && !error && collections.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {collections.map((col) => (
            <CollectionCard key={col._id} collection={col} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CollectionEditorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCollectionCreated}
        />
      )}
    </div>
  );
}
