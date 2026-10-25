import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        className="toast-container"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--subtle-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              minWidth: "280px",
              maxWidth: "420px",
              animation: "toastSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {toast.type === "success" && (
              <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            )}
            {toast.type === "error" && (
              <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
            )}
            {toast.type === "info" && (
              <Info size={18} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
            )}
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                color: "var(--text-muted)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
