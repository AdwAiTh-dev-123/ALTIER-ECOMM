// frontend/src/pages/admin/AdminCategoriesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAdminCategories,
  toggleCategoryStatus,
  deleteAdminCategory,
  updateAdminCategory,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminCategoriesPage.css";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unlisted: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Confirmation modal state for unlisting/listing
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    category: null,
  });

  //Model for delete category
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null,
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    categoryId: null,
    name: "",
    description: "",
    isListed: true,
    loading: false,
    error: "",
  });

  // ✅ AFTER
  // Debounce search typing only (resets page to 1 on new search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch function: Only affects tableLoading
  const loadCategories = useCallback(async () => {
    setTableLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminCategories({
        search: debouncedSearch,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });
      setCategories(res.data.data || []);

      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load categories",
      );
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, currentPage]);

  // Triggers instantly on page change or filter change
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleToggleClick = (targetCategory) => {
    setConfirmModal({
      isOpen: true,
      category: targetCategory,
    });
  };

  const handleConfirmToggle = async () => {
    const targetCategory = confirmModal.category;
    if (!targetCategory) return;

    setConfirmModal({ isOpen: false, category: null });
    setActionLoadingId(targetCategory._id);
    setErrorMessage("");
    setSuccessToast("");

    try {
      const res = await toggleCategoryStatus(targetCategory._id);
      const updatedCategory = res.data.data;

      // Update state locally without full refetch
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === updatedCategory._id
            ? { ...cat, isListed: updatedCategory.isListed }
            : cat,
        ),
      );

      // Automatically update category stats
      if (res.data.stats) {
        setStats(res.data.stats);
      } else {
        setStats((prev) => {
          const wasListed = targetCategory.isListed;
          return {
            ...prev,
            active: wasListed ? Math.max(0, prev.active - 1) : prev.active + 1,
            unlisted: wasListed
              ? prev.unlisted + 1
              : Math.max(0, prev.unlisted - 1),
          };
        });
      }

      setSuccessToast(res.data.message);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Could not change category status",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    const target = deleteModal.category;
    if (!target) return;

    setDeleteModal({ isOpen: false, category: null });
    setActionLoadingId(target._id);
    setErrorMessage("");

    try {
      const res = await deleteAdminCategory(target._id);
      // Remove deleted category from local list immediately
      setCategories((prev) => prev.filter((c) => c._id !== target._id));

      // Automatically update category stats on delete
      if (res.data.stats) {
        setStats(res.data.stats);
      } else {
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          active: target.isListed ? Math.max(0, prev.active - 1) : prev.active,
          unlisted: !target.isListed
            ? Math.max(0, prev.unlisted - 1)
            : prev.unlisted,
        }));
      }

      setSuccessToast(res.data.message);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to delete category",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenEdit = (category) => {
    setEditModal({
      isOpen: true,
      categoryId: category._id,
      name: category.name,
      description: category.description || "",
      isListed: category.isListed,
      loading: false,
      error: "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.name.trim()) {
      setEditModal((prev) => ({
        ...prev,
        error: "Category name is required.",
      }));
      return;
    }

    setEditModal((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const res = await updateAdminCategory(editModal.categoryId, {
        name: editModal.name.trim(),
        description: editModal.description.trim(),
        isListed: editModal.isListed,
      });

      const updated = res.data.data;

      // Update table state locally
      setCategories((prev) =>
        prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
      );

      // Keep category statistics in sync if visibility changed
      const prevCat = categories.find((c) => c._id === updated._id);
      if (prevCat && prevCat.isListed !== updated.isListed) {
        setStats((prev) => ({
          ...prev,
          active: updated.isListed
            ? prev.active + 1
            : Math.max(0, prev.active - 1),
          unlisted: updated.isListed
            ? Math.max(0, prev.unlisted - 1)
            : prev.unlisted + 1,
        }));
      }

      setSuccessToast(res.data?.message || "Category updated successfully.");
      setTimeout(() => setSuccessToast(""), 4000);
      setEditModal({
        isOpen: false,
        categoryId: null,
        name: "",
        description: "",
        isListed: true,
        loading: false,
        error: "",
      });
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || "Failed to update category.",
      }));
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-page-title">Category Management</h1>
            <p className="admin-page-subtitle">
              Organize, create, and control active product categories in your
              store.
            </p>
          </div>
          <Link
            to="/admin/categories/add"
            className="admin-btn-primary"
            style={{ textDecoration: "none" }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Categories</span>
            <span className="admin-stat-icon-wrap">🏷️</span>
          </div>
          <div className="admin-stat-value">
            {initialLoading ? "..." : stats.total}
          </div>
          <span className="admin-stat-note">All catalog categories</span>
        </div>

        <div className="admin-stat-card stat-success">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active / Listed</span>
            <span className="admin-stat-icon-wrap">✓</span>
          </div>
          <div className="admin-stat-value">
            {initialLoading ? "..." : stats.active}
          </div>
          <span className="admin-stat-note">
            Visible on storefront navigation
          </span>
        </div>

        <div className="admin-stat-card stat-danger">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Unlisted</span>
            <span className="admin-stat-icon-wrap">✕</span>
          </div>
          <div className="admin-stat-value">
            {initialLoading ? "..." : stats.unlisted}
          </div>
          <span className="admin-stat-note">Hidden from customer catalog</span>
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
            placeholder="Search category by name or description..."
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
          {/*Sort*/}
          <div className="admin-sort-wrap">
            <label htmlFor="category-sort" className="admin-sort-label">
              Sort By:
            </label>
            <select
              id="category-sort"
              className="admin-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newField, newOrder] = e.target.value.split("-");
                setSortBy(newField);
                setSortOrder(newOrder);
                setCurrentPage(1);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A – Z)</option>
              <option value="name-desc">Name (Z – A)</option>
            </select>
          </div>

          <div className="admin-filter-tabs">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Listed" },
              { id: "unlisted", label: "Unlisted" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-filter-tab ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-panel-card">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Created Date</th>
                <th>Visibility</th>
                <th style={{ textAlign: "right", width: "240px" }}>Actions</th>
              </tr>
            </thead>
            <tbody
              style={{
                opacity: tableLoading ? 0.6 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {initialLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--text-muted, #78716c)",
                    }}
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--text-muted, #78716c)",
                    }}
                  >
                    No categories found. Click <strong>+ Add Category</strong>{" "}
                    to create your first one.
                  </td>
                </tr>
              ) : (
                categories.map((item) => {
                  const isActionLoading = actionLoadingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className={!item.isListed ? "row-blocked" : ""}
                    >
                      <td>
                        <strong
                          style={{ fontSize: "0.92rem", color: "#1c1917" }}
                        >
                          {item.name}
                        </strong>
                      </td>
                      <td
                        style={{
                          maxWidth: "260px",
                          color: "var(--text-secondary, #44403c)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {item.description || "—"}
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
                          className={`admin-status-badge ${
                            item.isListed ? "status-active" : "status-blocked"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {item.isListed ? "Listed" : "Unlisted"}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          width: "240px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleToggleClick(item)}
                            className={`admin-action-btn btn-toggle ${
                              item.isListed ? "btn-block" : "btn-unblock"
                            }`}
                          >
                            {isActionLoading
                              ? "Updating..."
                              : item.isListed
                                ? "Unlist"
                                : "List"}
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleOpenEdit(item)}
                            className="admin-action-btn admin-btn-secondary"
                            style={{
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              setDeleteModal({ isOpen: true, category: item })
                            }
                            className="admin-action-btn btn-delete"
                          >
                            Delete
                          </button>
                        </div>
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
              {confirmModal.category?.isListed
                ? "Unlist Category"
                : "List Category"}
            </h3>
            <p className="admin-modal-message">
              Are you sure you want to{" "}
              {confirmModal.category?.isListed ? "hide" : "publish"}{" "}
              <strong>{confirmModal.category?.name}</strong>?
              {confirmModal.category?.isListed && (
                <span className="admin-modal-warning">
                  {" "}
                  This category will no longer appear in the customer shop
                  navigation or filters.
                </span>
              )}
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setConfirmModal({ isOpen: false, category: null })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-modal-confirm-btn ${
                  confirmModal.category?.isListed
                    ? "btn-confirm-block"
                    : "btn-confirm-unblock"
                }`}
                onClick={handleConfirmToggle}
              >
                Yes,{" "}
                {confirmModal.category?.isListed
                  ? "Unlist"
                  : "Publish to Store"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Delete Category</h3>
            <p className="admin-modal-message">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteModal.category?.name}</strong>?
              <span className="admin-modal-warning">
                This action is permanent and cannot be undone.
              </span>
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setDeleteModal({ isOpen: false, category: null })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm-btn btn-confirm-block"
                onClick={handleConfirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editModal.isOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() =>
            !editModal.loading &&
            setEditModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div
            className="admin-modal-box"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-modal-title">Edit Category</h3>
            <p
              className="admin-modal-message"
              style={{ marginBottom: "1.25rem" }}
            >
              Update category details and storefront visibility.
            </p>

            {editModal.error && (
              <div
                className="admin-alert-banner alert-danger"
                style={{ marginBottom: "1rem" }}
              >
                {editModal.error}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#1c1917",
                  }}
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ paddingLeft: "0.85rem", width: "100%" }}
                  value={editModal.name}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Heavyweight Knitwear"
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#1c1917",
                  }}
                >
                  Description
                </label>
                <textarea
                  className="admin-search-input"
                  style={{
                    paddingLeft: "0.85rem",
                    width: "100%",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  value={editModal.description}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of products within this category..."
                  rows={3}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "1.5rem",
                }}
              >
                <input
                  type="checkbox"
                  id="editIsListed"
                  checked={editModal.isListed}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      isListed: e.target.checked,
                    }))
                  }
                  style={{
                    width: "17px",
                    height: "17px",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="editIsListed"
                  style={{
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    color: "#44403c",
                  }}
                >
                  Publish &amp; List on Storefront
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() =>
                    setEditModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  disabled={editModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={editModal.loading}
                >
                  {editModal.loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
