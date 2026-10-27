import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Search,
  Clapperboard,
  PlusSquare,
  Bell,
  Bookmark,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { notificationsApi } from "../../api/notifications.api.js";
import Avatar from "../common/Avatar.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        if (isMounted && res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        // Silent catch for background unread count
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Polling every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "Home", to: "/home", icon: Home },
    { label: "Explore", to: "/explore", icon: Compass },
    { label: "Search", to: "/search", icon: Search },
    { label: "Reels", to: "/reels", icon: Clapperboard },
    { label: "Create", to: "/create", icon: PlusSquare },
    {
      label: "Notifications",
      to: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { label: "Collections", to: "/collections", icon: Layers },
    { label: "Saved", to: "/saved", icon: Bookmark },
    {
      label: "Profile",
      to: user ? `/profile/${user.username}` : "/login",
      icon: () => <Avatar src={user?.profile_pic} alt={user?.username} size="xs" />,
    },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className="app-sidebar"
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid var(--subtle-border)",
        backgroundColor: "var(--bg-surface)",
        padding: "24px 16px",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      <div>
        {/* Brand header */}
        <div style={{ padding: "0 12px 28px 12px" }}>
          <NavLink to="/home" style={{ display: "inline-block" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              FRAME
            </h1>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "0.625rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Editorial Photography
            </span>
          </NavLink>
        </div>

        {/* Navigation list */}
        <nav aria-label="Main Navigation">
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: isActive ? "2px solid var(--brand-accent)" : "2px solid transparent",
                      fontSize: "0.9375rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--brand-accent)" : "var(--text-secondary)",
                      backgroundColor: isActive ? "var(--soft-accent-surface)" : "transparent",
                      transition: "all var(--transition-fast)",
                      position: "relative",
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains("active")) {
                        e.currentTarget.style.backgroundColor = "var(--bg-surface-secondary)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.classList.contains("active")) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconComponent size={20} />
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          marginLeft: "auto",
                          backgroundColor: "var(--brand-accent)",
                          color: "var(--brand-accent-text)",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "var(--radius-full)",
                          minWidth: "18px",
                          textAlign: "center",
                        }}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* User profile & actions footer */}
      <div
        style={{
          borderTop: "1px solid var(--subtle-border)",
          paddingTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>
          <ThemeToggle showLabel={false} />
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out of FRAME"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              transition: "color var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              transition: "background-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--muted-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Avatar src={user.profile_pic} alt={user.fullName || user.username} size="sm" />
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  color: "var(--text-primary)",
                }}
              >
                {user.fullName || user.username}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>@{user.username}</p>
            </div>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
