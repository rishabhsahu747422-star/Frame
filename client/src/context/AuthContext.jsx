import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth.api.js";
import { usersApi } from "../api/users.api.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await usersApi.getMe();
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
      setUser(null);
      return null;
    } catch (err) {
      // 401 or network error on startup means not authenticated
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen for session expiration events emitted by api client
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("frame:session-expired", handleSessionExpired);
    return () => window.removeEventListener("frame:session-expired", handleSessionExpired);
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res?.data) {
      // Refresh full profile including counters
      return await fetchCurrentUser();
    }
    return res;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    if (res?.data) {
      return await fetchCurrentUser();
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateUser,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
