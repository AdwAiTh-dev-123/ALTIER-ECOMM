import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "../../styles/admins/admin.css";
import "../../styles/admins/AdminLayout.css";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-root-container">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar with toggle support */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="admin-main-viewport">
        <header className="admin-top-header">
          <div className="admin-header-left">
            {/* Hamburger Button (visible on mobile only) */}
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            <div className="admin-top-breadcrumb">
              <span className="admin-portal-tag">PORTAL</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-current">
                Management Console
              </span>
            </div>
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
