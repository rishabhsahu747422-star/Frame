import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import Avatar from "../common/Avatar.jsx";

export default function TopBar() {
  const { user } = useAuth();
  const { activeTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      className="mobile-topbar"
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--subtle-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link to="/home" style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--text-primary)",
          }}
        >
          FRAME
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => navigate("/search")}
          aria-label="Search"
          style={{
            padding: "8px",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search size={20} />
        </button>

        <button
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          style={{
            padding: "8px",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Bell size={20} />
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            padding: "8px",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {activeTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user && (
          <Link to={`/profile/${user.username}`} style={{ display: "flex" }}>
            <Avatar src={user.profile_pic} alt={user.username} size="xs" />
          </Link>
        )}
      </div>
    </header>
  );
}
