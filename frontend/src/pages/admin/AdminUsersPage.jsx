// frontend/src/pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getAdminUsers, toggleBlockUserStatus } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminUsers({ search, status: statusFilter });
      setUsers(res.data.data || []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load users list",
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleToggleClick = (targetUser) => {
    // Open confirmation dialog
    setConfirmModal({
      isOpen: true,
      user: targetUser,
    });
  };

  const handleConfirmToggle = async () => {
    const targetUser = confirmModal.user;
    if (!targetUser) return;

    setConfirmModal({ isOpen: false, user: null });
    setActionLoadingId(targetUser._id);
    setErrorMessage("");
    setSuccessToast("");

    try {
      const res = await toggleBlockUserStatus(targetUser._id);
      const updatedUser = res.data.data;

      // Update state locally without full refetch
      setUsers((prev) =>
        prev.map((u) =>
          u._id === updatedUser._id
            ? { ...u, isBlocked: updatedUser.isBlocked }
            : u,
        ),
      );

      setSuccessToast(res.data.message);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Could not change user status",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">
            View, monitor, and regulate user privileges and account access.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="admin-alert-banner alert-success">{successToast}</div>
      )}
      {errorMessage && (
        <div className="admin-alert-banner alert-danger">{errorMessage}</div>
      )}

      {/* Search & Filters */}
      <div className="admin-controls-bar">
        <div className="admin-search-wrap">
          <svg
            className="admin-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-filter-tabs">
          {["all", "active", "blocked"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-filter-tab ${statusFilter === tab ? "active" : ""}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-panel-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Account Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-loading-cell">
                    <div className="admin-spinner-inline"></div> Loading
                    registered users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-cell">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrentAdmin = currentAdmin?._id === item._id;
                  const isActionLoading = actionLoadingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className={item.isBlocked ? "row-blocked" : ""}
                    >
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-sm">
                            {(item.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="admin-user-name">
                              {item.name}
                              {isCurrentAdmin && (
                                <span className="admin-you-tag">You</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-email-text">{item.email}</td>
                      <td>
                        <span
                          className={`admin-role-badge ${item.role === "admin" ? "badge-admin" : "badge-customer"}`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="admin-date-text">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`admin-status-badge ${item.isBlocked ? "status-blocked" : "status-active"}`}
                        >
                          <span className="status-dot"></span>
                          {item.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isCurrentAdmin ? (
                          <span className="admin-action-disabled-note">
                            Self
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleToggleClick(item)}
                            className={`admin-action-btn btn-toggle ${item.isBlocked ? "btn-unblock" : "btn-block"}`}
                          >
                            {isActionLoading
                              ? "Updating..."
                              : item.isBlocked
                                ? "Unblock"
                                : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">
              {confirmModal.user?.isBlocked
                ? "Unblock Account"
                : "Block User Account"}
            </h3>
            <p className="admin-modal-message">
              Are you sure you want to{" "}
              {confirmModal.user?.isBlocked ? "unblock" : "restrict"}{" "}
              <strong>{confirmModal.user?.name}</strong> (
              {confirmModal.user?.email})?
              {!confirmModal.user?.isBlocked && (
                <span className="admin-modal-warning">
                  {" "}
                  This user will immediately be blocked from logging in or using
                  the storefront.
                </span>
              )}
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setConfirmModal({ isOpen: false, user: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-modal-confirm-btn ${confirmModal.user?.isBlocked ? "btn-confirm-unblock" : "btn-confirm-block"}`}
                onClick={handleConfirmToggle}
              >
                Yes,{" "}
                {confirmModal.user?.isBlocked ? "Unblock" : "Block Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
