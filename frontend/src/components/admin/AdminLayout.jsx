// frontend/src/components/admin/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "../../styles/admin.css";

const AdminLayout = () => {
  return (
    <div className="admin-root-container">
      <AdminSidebar />
      <div className="admin-main-viewport">
        <header className="admin-top-header">
          <div className="admin-top-breadcrumb">
            <span className="admin-portal-tag">PORTAL</span>
            <span className="admin-breadcrumb-sep">/</span>
            <span className="admin-breadcrumb-current">Management Console</span>
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
