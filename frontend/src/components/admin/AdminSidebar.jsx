import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admins/AdminSidebar.css";

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {" "}
      <div className="admin-sidebar-header">
        <Link to="/admin" className="admin-brand" onClick={onClose}>
          <img src="/logo.png" alt="ALTIER" className="admin-logo-img" />
          <span className="admin-brand-badge">ADMIN</span>
        </Link>
        <button
          type="button"
          className="admin-sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>
      <div className="admin-sidebar-nav">
        <span className="admin-nav-section-label">MAIN MENU</span>

        {/* Dashboard Link */}
        <NavLink
          to="/admin"
          onClick={onClose}
          end
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        {/* Users Link */}
        <NavLink
          to="/admin/users"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Users</span>
        </NavLink>

        {/* Categories Link */}
        <NavLink
          to="/admin/categories"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span>Categories</span>
        </NavLink>

        {/* Products Link */}
        <NavLink
          to="/admin/products"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Products</span>
        </NavLink>

        {/* Orders Link */}
        <NavLink
          to="/admin/orders"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="2" />
            <path d="M9 14l2 2 4-4" />
          </svg>
          <span>Orders</span>
        </NavLink>

        {/* Coupons Link */}
        <NavLink
          to="/admin/coupons"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span>Coupons</span>
        </NavLink>

        {/* Offers Link */}
        <NavLink
          to="/admin/offers"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Offers</span>
        </NavLink>

        {/* Sales Report Link */}
        <NavLink
          to="/admin/sales-report"
          onClick={onClose}
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
          <span>Sales Report</span>
        </NavLink>
      </div>
      <div className="admin-sidebar-footer">
        <div className="admin-user-profile-card">
          <div className="admin-avatar">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="admin-profile-info">
            <div className="admin-profile-name">{user?.name || "Admin"}</div>
            <div className="admin-profile-email">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="admin-sidebar-logout-btn"
            title="Log Out"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
