// frontend/src/pages/admin/AdminDashboardPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers } from "../../api/adminApi";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await getAdminUsers();
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        if (res.data?.data) {
          setRecentUsers(res.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Overview Dashboard</h1>
          <p className="admin-page-subtitle">
            Real-time status of users and boutique store activity.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
            <span className="admin-stat-icon-wrap">👥</span>
          </div>
          <div className="admin-stat-value">
            {loading ? "..." : stats.total}
          </div>
          <span className="admin-stat-note">
            All registered customer accounts
          </span>
        </div>

        <div className="admin-stat-card stat-success">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active Users</span>
            <span className="admin-stat-icon-wrap">✓</span>
          </div>
          <div className="admin-stat-value">
            {loading ? "..." : stats.active}
          </div>
          <span className="admin-stat-note">Full store & checkout access</span>
        </div>

        <div className="admin-stat-card stat-danger">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Restricted / Blocked</span>
            <span className="admin-stat-icon-wrap">✕</span>
          </div>
          <div className="admin-stat-value">
            {loading ? "..." : stats.blocked}
          </div>
          <span className="admin-stat-note">
            Access blocked by administrator
          </span>
        </div>
      </div>

      {/* Quick Navigation Card */}
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3 className="admin-panel-title">Recent User Registrations</h3>
            <p className="admin-panel-desc">
              Latest customers who joined the platform
            </p>
          </div>
          <Link to="/admin/users" className="admin-btn-secondary">
            Manage All Users →
          </Link>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar-sm">
                        {(u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="admin-user-name">{u.name}</span>
                    </div>
                  </td>
                  <td className="admin-email-text">{u.email}</td>
                  <td>
                    <span
                      className={`admin-role-badge ${u.role === "admin" ? "badge-admin" : "badge-customer"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-status-badge ${u.isBlocked ? "status-blocked" : "status-active"}`}
                    >
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="admin-empty-cell">
                    No users registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
