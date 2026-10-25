import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import MobileNav from "./MobileNav.jsx";

export default function AppShell({ showRightRail = false, rightRailComponent = null }) {
  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-main)",
        color: "var(--text-primary)",
      }}
    >
      {/* Desktop Sidebar (hidden on screens < 768px via CSS) */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className="app-main-content-wrapper"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}
      >
        {/* Mobile/Tablet TopBar (hidden on desktop via CSS) */}
        <TopBar />

        {/* Content Outlet */}
        <main
          className="app-main-view"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div
            className="app-page-container"
            style={{
              width: "100%",
              maxWidth: "var(--page-max-width)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              className="app-center-feed"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "20px 16px 80px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ width: "100%", maxWidth: "100%" }}>
                <Outlet />
              </div>
            </div>

            {/* Optional Right Rail on wide desktop screens */}
            {showRightRail && rightRailComponent}
          </div>
        </main>

        {/* Mobile Bottom Navigation (hidden on desktop via CSS) */}
        <MobileNav />
      </div>
    </div>
  );
}
