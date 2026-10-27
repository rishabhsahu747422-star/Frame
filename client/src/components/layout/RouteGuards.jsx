import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Skeleton from "../common/Skeleton.jsx";
import Logo from "../common/Logo.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-main)",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", width: "260px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <Logo variant="full" size="lg" animated />
          </div>
          <Skeleton height="3px" borderRadius="var(--radius-full)" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
