import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Palette,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { usersApi } from "../api/users.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Button from "../components/common/Button.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const avatarInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleAvatarChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are permitted for avatars", "error");
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await usersApi.updateProfilePicture(file);
      const updatedUser = res.data?.user || res.user || res.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      showToast("Profile avatar updated successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to update avatar", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);

    try {
      const res = await usersApi.updateProfile({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      const updated = res.updatedUser || res.data?.user || res.user || res.data;
      if (updated) {
        updateUser(updated);
      }
      showToast("Profile details updated successfully", "success");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
      showToast(err.message || "Error saving profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      showToast("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
      showToast(err.message || "Password update failed", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast("Signed out of FRAME", "default");
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>
      {/* Title */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            letterSpacing: "-0.03em",
            marginBottom: "0.25rem",
          }}
        >
          Account Settings
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
          Manage your creator profile, theme preferences, and security settings.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile" ? "2px solid var(--color-text)" : "2px solid transparent",
            padding: "0.75rem 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: activeTab === "profile" ? "var(--color-text)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "profile" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          <User size={18} />
          Profile
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "appearance" ? "2px solid var(--color-text)" : "2px solid transparent",
            padding: "0.75rem 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: activeTab === "appearance" ? "var(--color-text)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "appearance" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          <Palette size={18} />
          Appearance
        </button>

        <button
          onClick={() => setActiveTab("security")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "security" ? "2px solid var(--color-text)" : "2px solid transparent",
            padding: "0.75rem 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: activeTab === "security" ? "var(--color-text)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "security" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          <Shield size={18} />
          Security
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          {profileError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <AlertCircle size={18} />
              <span>{profileError}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: "2rem",
            }}
          >
            <div style={{ position: "relative" }}>
              <Avatar src={currentUser?.profile_pic} name={currentUser?.name || currentUser?.username} size="xl" />
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.25rem" }}>Profile Avatar</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
                Upload a high-resolution photo for your creator presence.
              </p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleAvatarChange(e.target.files[0])}
              />
              <Button
                variant="outline"
                size="sm"
                loading={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={14} />
                {avatarUploading ? "Uploading..." : "Change Avatar"}
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <div>
                <label
                  htmlFor="displayName"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
                >
                  Username Handle
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                htmlFor="bio"
                style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
              >
                Biography / Visual Statement
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your focus, camera gear, location, or editorial philosophy..."
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="primary" loading={profileSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Color Theme</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Choose how FRAME appears on your device. The default follows your system preference.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div
              onClick={() => setTheme("light")}
              style={{
                border: `2px solid ${theme === "light" ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                cursor: "pointer",
                background: "#F7F6F2",
                color: "#191919",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all var(--transition-fast)",
              }}
            >
              <Sun size={24} color="#6558D3" />
              <strong style={{ fontSize: "1rem" }}>Light Theme</strong>
              <span style={{ fontSize: "0.8rem", color: "#777777" }}>
                #F7F6F2 background with high editorial contrast
              </span>
            </div>

            <div
              onClick={() => setTheme("dark")}
              style={{
                border: `2px solid ${theme === "dark" ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                cursor: "pointer",
                background: "#15151A",
                color: "#F5F4F1",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all var(--transition-fast)",
              }}
            >
              <Moon size={24} color="#B5A9FF" />
              <strong style={{ fontSize: "1rem" }}>Dark Theme</strong>
              <span style={{ fontSize: "0.8rem", color: "#AAA9B2" }}>
                #15151A dark canvas tailored for photography
              </span>
            </div>

            <div
              onClick={() => setTheme("system")}
              style={{
                border: `2px solid ${theme === "system" ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                cursor: "pointer",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all var(--transition-fast)",
              }}
            >
              <Laptop size={24} color="var(--color-accent)" />
              <strong style={{ fontSize: "1rem" }}>System Default</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                Automatically matches your OS settings
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Change Password</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Update your account password with at least 6 characters.
          </p>

          {passwordError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <AlertCircle size={18} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="currPass"
                style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
              >
                Current Password
              </label>
              <input
                id="currPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="newPass"
                style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
              >
                New Password
              </label>
              <input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                htmlFor="confPass"
                style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}
              >
                Confirm New Password
              </label>
              <input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "0.75rem 1rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            <Button type="submit" variant="primary" loading={passwordSaving}>
              Update Password
            </Button>
          </form>

          {/* Session / Logout section */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                Sign Out
              </strong>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                End your active session on this device.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out of FRAME"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Sign Out"
        isDestructive={false}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
}
