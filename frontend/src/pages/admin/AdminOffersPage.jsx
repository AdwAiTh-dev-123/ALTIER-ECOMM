import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  toggleAdminOfferStatus,
  deleteAdminOffer,
  getAdminCategories,
  getAdminProducts,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/admin.css";

const AdminOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offerTypeFilter, setOfferTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    offer: null,
  });
  const [editingOfferId, setEditingOfferId] = useState(null);

  // Target Pickers Data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const defaultStartDate = new Date().toISOString().slice(0, 16);
  const defaultEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const [formData, setFormData] = useState({
    name: "",
    offerType: "PRODUCT",
    discountPercentage: "",
    productId: "",
    categoryId: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 3500);
  };

  // 1. Fetch offers list
  const fetchOffers = useCallback(
    async (isTableOnly = false) => {
      try {
        if (isTableOnly) setTableLoading(true);
        else setLoading(true);

        const params = {
          page: currentPage,
          limit: 10,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          offerType: offerTypeFilter !== "all" ? offerTypeFilter : undefined,
          sortBy,
        };

        const res = await getAdminOffers(params);
        if (res.data?.success) {
          setOffers(res.data.data || []);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
          setPagination({
            totalPages: res.data.pagination?.totalPages || 1,
            totalItems: res.data.pagination?.totalItems || 0,
            limit: res.data.pagination?.limit || 10,
          });
        }
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to load offers",
          "error",
        );
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [currentPage, debouncedSearch, offerTypeFilter, statusFilter, sortBy],
  );

  useEffect(() => {
    fetchOffers(offers.length > 0);
  }, [fetchOffers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Categories & Products when opening Create Modal
  useEffect(() => {
    if (isCreateModalOpen && categories.length === 0) {
      Promise.all([
        getAdminCategories({ limit: 100 }),
        getAdminProducts({ limit: 100 }),
      ])
        .then(([catRes, prodRes]) => {
          setCategories(catRes.data?.data || catRes.data?.categories || []);
          setProducts(prodRes.data?.data || prodRes.data?.products || []);
        })
        .catch(() => {});
    }
  }, [isCreateModalOpen, categories.length]);

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create Offer Submit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Offer title is required.");
      return;
    }

    const discount = Number(formData.discountPercentage);
    if (!discount || discount < 1 || discount > 90) {
      setFormError("Discount percentage must be between 1% and 90%.");
      return;
    }

    if (formData.offerType === "PRODUCT" && !formData.productId) {
      setFormError("Please select a target product.");
      return;
    }

    if (formData.offerType === "CATEGORY" && !formData.categoryId) {
      setFormError("Please select a target category.");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError("End date must be after start date.");
      return;
    }

    try {
      setFormSubmitting(true);
      let res;
      if (editingOfferId) {
        // Edit existing offer
        res = await updateAdminOffer(editingOfferId, formData);
        showToast(`Offer "${formData.name}" updated successfully!`);
      } else {
        // Create new offer
        res = await createAdminOffer(formData);
        showToast(`Offer "${formData.name}" created successfully!`);
      }

      if (res.data?.success) {
        setIsCreateModalOpen(false);
        setEditingOfferId(null);
        fetchOffers(true);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save offer.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (offerId) => {
    try {
      setActionLoadingId(offerId);
      const res = await toggleAdminOfferStatus(offerId);
      if (res.data?.success) {
        showToast(res.data.message || "Offer status updated.");
        setOffers((prev) =>
          prev.map((off) =>
            off._id === offerId ? { ...off, isActive: !off.isActive } : off,
          ),
        );
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to toggle offer.",
        "error",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Offer
  const handleDeleteOffer = async () => {
    const offer = deleteConfirmModal.offer;
    if (!offer) return;

    try {
      setActionLoadingId(offer._id);
      const res = await deleteAdminOffer(offer._id);
      if (res.data?.success) {
        showToast("Offer deleted successfully.");
        setDeleteConfirmModal({ isOpen: false, offer: null });
        fetchOffers(true);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete offer.",
        "error",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setFormError("");
    setFormData({
      name: "",
      offerType: "PRODUCT",
      discountPercentage: "",
      productId: "",
      categoryId: "",
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (offer) => {
    setEditingOfferId(offer._id);
    setFormError("");
    setFormData({
      name: offer.name || "",
      offerType: offer.offerType || "PRODUCT",
      discountPercentage: offer.discountPercentage || "",
      productId: offer.product?._id || offer.product || "",
      categoryId: offer.category?._id || offer.category || "",
      startDate: formatDateTimeLocal(offer.startDate),
      endDate: formatDateTimeLocal(offer.endDate),
    });
    setIsCreateModalOpen(true);
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`admin-toast ${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Offers & Discounts</h1>
          <p className="admin-page-subtitle">
            Configure promotional percentage offers for specific products or
            entire categories.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreateModal}
        >
          + Add New Offer
        </button>
      </div>

      {/* 1. Quick Stats Overview */}
      <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Offers</span>
          </div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Currently Active</span>
          </div>
          <div className="admin-stat-value" style={{ color: "#15803d" }}>
            {stats.active}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Expired</span>
          </div>
          <div className="admin-stat-value" style={{ color: "#dc2626" }}>
            {stats.expired}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          backgroundColor: "#ffffff",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid #e7e5e4",
          marginBottom: "1.5rem",
        }}
      >
        {/* Search input */}
        <input
          type="text"
          placeholder="Search offers by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: "260px",
            padding: "0.5rem 0.85rem",
            border: "1px solid #d6d3d1",
            borderRadius: "6px",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />

        {/* Filters & Sorting Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "0.5rem 0.85rem",
              border: "1px solid #d6d3d1",
              borderRadius: "6px",
              fontSize: "0.85rem",
              backgroundColor: "#fff",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="expired">Expired Only</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "0.5rem 0.85rem",
              border: "1px solid #d6d3d1",
              borderRadius: "6px",
              fontSize: "0.85rem",
              backgroundColor: "#fff",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="discount-high">Highest Discount</option>
            <option value="discount-low">Lowest Discount</option>
          </select>

          {/* Reset Filters Button */}
          {(search ||
            statusFilter !== "all" ||
            offerTypeFilter !== "all" ||
            sortBy !== "newest") && (
            <button
              type="button"
              className="filter-pill-btn"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setOfferTypeFilter("all");
                setSortBy("newest");
                setCurrentPage(1);
              }}
              style={{ fontSize: "0.78rem" }}
            >
              Clear Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Offer Type Pill Buttons */}
      <div className="admin-filters-bar">
        <button
          className={`filter-pill-btn ${offerTypeFilter === "all" ? "active" : ""}`}
          onClick={() => {
            setOfferTypeFilter("all");
            setCurrentPage(1);
          }}
        >
          All Offers
        </button>
        <button
          className={`filter-pill-btn ${offerTypeFilter === "PRODUCT" ? "active" : ""}`}
          onClick={() => {
            setOfferTypeFilter("PRODUCT");
            setCurrentPage(1);
          }}
        >
          Product Deals
        </button>
        <button
          className={`filter-pill-btn ${offerTypeFilter === "CATEGORY" ? "active" : ""}`}
          onClick={() => {
            setOfferTypeFilter("CATEGORY");
            setCurrentPage(1);
          }}
        >
          Category Promotions
        </button>
      </div>

      {/* Offers Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-loader">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="admin-empty-state">
            <p>No promotional offers found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer Details</th>
                <th>Type</th>
                <th>Applied Target</th>
                <th>Discount</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const expired = isExpired(offer.endDate);
                return (
                  <tr key={offer._id}>
                    <td>
                      <strong>{offer.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge-capsule ${offer.offerType === "PRODUCT" ? "badge-blue" : "badge-purple"}`}
                      >
                        {offer.offerType}
                      </span>
                    </td>
                    <td>
                      {offer.offerType === "PRODUCT"
                        ? offer.product?.name || "Specific Product"
                        : offer.category?.name || "Entire Category"}
                    </td>
                    <td>
                      <span
                        className="discount-tag"
                        style={{ color: "#2e7d32", fontWeight: "700" }}
                      >
                        {offer.discountPercentage}% OFF
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: expired ? "#b91c1c" : "#555",
                        }}
                      >
                        {new Date(offer.startDate).toLocaleDateString()} –{" "}
                        {new Date(offer.endDate).toLocaleDateString()}
                      </span>
                      {expired && (
                        <div style={{ fontSize: "0.75rem", color: "#b91c1c" }}>
                          Expired
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          expired
                            ? "status-expired"
                            : offer.isActive
                              ? "status-active"
                              : "status-inactive"
                        }`}
                      >
                        <span className="status-dot"></span>
                        {expired
                          ? "Expired"
                          : offer.isActive
                            ? "Active"
                            : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div
                        className="actions-cell-flex"
                        style={{ display: "flex", gap: "8px" }}
                      >
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => handleOpenEditModal(offer)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action-text"
                          disabled={actionLoadingId === offer._id}
                          onClick={() => handleToggleStatus(offer._id)}
                        >
                          {offer.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          disabled={actionLoadingId === offer._id}
                          onClick={() =>
                            setDeleteConfirmModal({ isOpen: true, offer })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* CREATE OFFER MODAL */}
      {isCreateModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box" style={{ maxWidth: "520px" }}>
            <h2 className="admin-modal-title">
              {editingOfferId ? "Edit Offer" : "Create New Offer"}
            </h2>
            <p className="admin-modal-subtitle">
              {editingOfferId
                ? "Update promotional details, discount values, or date range."
                : "Configure an offer for a product or category."}
            </p>

            {formError && <div className="admin-form-error">{formError}</div>}

            <form onSubmit={handleSubmitForm} className="admin-modal-form">
              <div className="form-group">
                <label>Offer Title *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Summer Flash Sale"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Offer Type *</label>
                <select
                  name="offerType"
                  value={formData.offerType}
                  onChange={handleInputChange}
                >
                  <option value="PRODUCT">Product Offer</option>
                  <option value="CATEGORY">Category Offer</option>
                </select>
              </div>

              {formData.offerType === "PRODUCT" ? (
                <div className="form-group">
                  <label>Select Product *</label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Choose a product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Select Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Choose a category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Discount Percentage (%) *</label>
                <input
                  type="number"
                  name="discountPercentage"
                  min="1"
                  max="90"
                  placeholder="e.g. 20"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div
                className="admin-modal-actions"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? editingOfferId
                      ? "Saving..."
                      : "Creating..."
                    : editingOfferId
                      ? "Save Changes"
                      : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal.isOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setDeleteConfirmModal({ isOpen: false, offer: null })}
        >
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Delete Offer</h2>
            <p className="admin-modal-message">
              Are you sure you want to delete{" "}
              <strong>"{deleteConfirmModal.offer?.name}"</strong>? This action
              cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-confirm-btn"
                style={{ backgroundColor: "#f5f5f4", color: "#44403c" }}
                onClick={() =>
                  setDeleteConfirmModal({ isOpen: false, offer: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm-btn btn-confirm-block"
                onClick={handleDeleteOffer}
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffersPage;
