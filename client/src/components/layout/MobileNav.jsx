import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, PlusSquare, Clapperboard, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../common/Avatar.jsx";

export default function MobileNav() {
  const { user } = useAuth();

  return (
    <nav
      className="mobile-bottomnav"
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--mobilenav-height)",
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--subtle-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
      }}
    >
      <NavLink
        to="/home"
        style={({ isActive }) => ({
          color: isActive ? "var(--brand-accent)" : "var(--text-secondary)",
          padding: "8px",
          display: "flex",
          alignItems: "center",
        })}
        aria-label="Home"
      >
        <Home size={22} />
      </NavLink>

      <NavLink
        to="/explore"
        style={({ isActive }) => ({
          color: isActive ? "var(--brand-accent)" : "var(--text-secondary)",
          padding: "8px",
          display: "flex",
          alignItems: "center",
        })}
        aria-label="Explore"
      >
        <Compass size={22} />
      </NavLink>

      <NavLink
        to="/create"
        style={{
          color: "var(--brand-accent-text)",
          backgroundColor: "var(--brand-accent)",
          padding: "8px",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-sm)",
        }}
        aria-label="Create Post"
      >
        <PlusSquare size={20} />
      </NavLink>

      <NavLink
        to="/reels"
        style={({ isActive }) => ({
          color: isActive ? "var(--brand-accent)" : "var(--text-secondary)",
          padding: "8px",
          display: "flex",
          alignItems: "center",
        })}
        aria-label="Reels"
      >
        <Clapperboard size={22} />
      </NavLink>

      <NavLink
        to={user ? `/profile/${user.username}` : "/login"}
        style={({ isActive }) => ({
          color: isActive ? "var(--brand-accent)" : "var(--text-secondary)",
          padding: "8px",
          display: "flex",
          alignItems: "center",
        })}
        aria-label="Profile"
      >
        {user ? (
          <Avatar src={user.profile_pic} alt={user.username} size="xs" />
        ) : (
          <User size={22} />
        )}
      </NavLink>
    </nav>
  );
}
