import React, { useState, useEffect, useCallback, useRef } from "react";
import { getAdminUsers, toggleBlockUserStatus } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminUsersPage.css";

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Custom In-DOM Sort Dropdown state
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target)
      ) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const SORT_OPTIONS = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "name-asc", label: "Name (A – Z)" },
    { value: "name-desc", label: "Name (Z – A)" },
    { value: "email-asc", label: "Email (A – Z)" },
    { value: "email-desc", label: "Email (Z – A)" },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === `${sortBy}-${sortOrder}`)?.label ||
    "Newest First";

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
  });

  const loadUsers = useCallback(async () => {
    setTableLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminUsers({
        search: debouncedSearch,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });
      setUsers(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load users list",
      );
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

        <div className="admin-controls-right">
          {/* Custom In-DOM Sort Dropdown */}
          <div className="admin-sort-wrap" ref={sortDropdownRef}>
            <button
              type="button"
              className="admin-custom-dropdown-btn"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              aria-expanded={isSortDropdownOpen}
            >
              <span className="admin-dropdown-btn-text">
                Sort: <strong>{currentSortLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${isSortDropdownOpen ? "open" : ""}`}
              >
                ▾
              </span>
            </button>

            {isSortDropdownOpen && (
              <div className="admin-custom-dropdown-menu">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = `${sortBy}-${sortOrder}` === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`admin-dropdown-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const [newField, newOrder] = opt.value.split("-");
                        setSortBy(newField);
                        setSortOrder(newOrder);
                        setCurrentPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="dropdown-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-filter-tabs">
            {["all", "active", "blocked"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-filter-tab ${statusFilter === tab ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPage(1);
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tableLoading ? "admin-tbody-loading" : "admin-tbody"}>
              {initialLoading ? (
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
                      <td className="text-right">
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
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit || 10}
          onPageChange={(page) => setCurrentPage(page)}
          loading={tableLoading}
        />
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
