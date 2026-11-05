import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponStatus,
  deleteAdminCoupon,
  getAdminCategories,
  getAdminProducts,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/admin.css";

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    coupon: null,
  });

  // Store data for applicability pickers
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  // Create Form State
  const defaultStartDate = new Date().toISOString().slice(0, 16);
  const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    minPurchaseAmount: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    applicabilityType: "ALL",
    applicableCategories: [],
    applicableProducts: [],
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 3500);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Categories and Products once when opening modal
  useEffect(() => {
    if (isCreateModalOpen) {
      if (availableCategories.length === 0) {
        getAdminCategories({ limit: 100 })
          .then((res) => setAvailableCategories(res.data.data || []))
          .catch(() => {});
      }
      if (availableProducts.length === 0) {
        getAdminProducts({ limit: 100 })
          .then((res) =>
            setAvailableProducts(res.data.products || res.data.data || []),
          )
          .catch(() => {});
      }
    }
  }, [isCreateModalOpen, availableCategories.length, availableProducts.length]);

  // Fetch Coupons
  const loadCoupons = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await getAdminCoupons({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });

      const couponList = res.data.data || [];
      setCoupons(couponList);
      if (res.data.stats) setStats(res.data.stats);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load coupons",
        "error",
      );
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "code") {
      setFormData((prev) => ({
        ...prev,
        code: value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Category Checkbox Toggle
  const toggleCategorySelection = (categoryId) => {
    setFormData((prev) => {
      const exists = prev.applicableCategories.includes(categoryId);
      return {
        ...prev,
        applicableCategories: exists
          ? prev.applicableCategories.filter((id) => id !== categoryId)
          : [...prev.applicableCategories, categoryId],
      };
    });
  };

  // Product Checkbox Toggle
  const toggleProductSelection = (productId) => {
    setFormData((prev) => {
      const exists = prev.applicableProducts.includes(productId);
      return {
        ...prev,
        applicableProducts: exists
          ? prev.applicableProducts.filter((id) => id !== productId)
          : [...prev.applicableProducts, productId],
      };
    });
  };

  // Submit Create Coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.code || formData.code.trim().length < 3) {
      setFormError("Coupon code must be at least 3 characters.");
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (
      formData.discountType === "PERCENTAGE" &&
      Number(formData.discountValue) > 100
    ) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError("Expiry date must be after the start date.");
      return;
    }
    if (
      formData.applicabilityType === "CATEGORY" &&
      formData.applicableCategories.length === 0
    ) {
      setFormError(
        "Please select at least one category, or switch to 'All Products'.",
      );
      return;
    }
    if (
      formData.applicabilityType === "PRODUCT" &&
      formData.applicableProducts.length === 0
    ) {
      setFormError(
        "Please select at least one product, or switch to 'All Products'.",
      );
      return;
    }

    try {
      setFormSubmitting(true);
      await createAdminCoupon(formData);
      showToast(`Coupon "${formData.code}" created successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maxDiscountAmount: "",
        minPurchaseAmount: "",
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        applicabilityType: "ALL",
        applicableCategories: [],
        applicableProducts: [],
      });
      loadCoupons();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create coupon.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon) => {
    setActionLoadingId(coupon._id);
    try {
      const res = await toggleAdminCouponStatus(coupon._id);
      showToast(res.data.message);
      loadCoupons();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update status",
        "error",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!deleteConfirmModal.coupon) return;
    const { _id, code } = deleteConfirmModal.coupon;
    try {
      setActionLoadingId(_id);
      await deleteAdminCoupon(_id);
      showToast(`Coupon "${code}" deleted successfully.`);
      setDeleteConfirmModal({ isOpen: false, coupon: null });
      loadCoupons();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete coupon",
        "error",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Check validity badge
  const getValidityBadge = (startDate, endDate, isActive) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isActive) {
      return (
        <span className="admin-status-badge status-blocked">
          <span className="status-dot"></span> Inactive
        </span>
      );
    }
    if (now < start) {
      return (
        <span
          className="admin-status-badge"
          style={{ backgroundColor: "#fef9c3", color: "#854d0e" }}
        >
          Upcoming
        </span>
      );
    }
    if (now > end) {
      return (
        <span className="admin-status-badge status-blocked">
          <span className="status-dot"></span> Expired
        </span>
      );
    }
    return (
      <span className="admin-status-badge status-active">
        <span className="status-dot"></span> Active
      </span>
    );
  };

  return (
    <div className="admin-page-container">
      {/* Toast Alert */}
      {toastMessage.text && (
        <div
          className={`admin-alert-banner ${toastMessage.type === "error" ? "admin-alert-danger" : "admin-alert-success"}`}
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "2rem",
            zIndex: 9999,
          }}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div
        className="admin-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="admin-page-title">Coupons & Promotions</h1>
          <p className="admin-page-subtitle">
            Create and manage discount codes, validity windows, and
            applicability rules.
          </p>
        </div>
        <button
          className="admin-btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>+ Create Coupon</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Coupons</span>
          </div>
          <div
            className="admin-stat-value"
            style={{ fontSize: "1.75rem", fontWeight: "700" }}
          >
            {stats.total}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Currently Active</span>
          </div>
          <div
            className="admin-stat-value"
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "var(--success, #15803d)",
            }}
          >
            {stats.active}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Expired</span>
          </div>
          <div
            className="admin-stat-value"
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "var(--danger, #dc2626)",
            }}
          >
            {stats.expired}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div
        className="admin-table-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          backgroundColor: "#fff",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle, #e7e5e4)",
        }}
      >
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by code (e.g. SUMMER20)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: "260px",
            padding: "0.5rem 0.85rem",
            border: "1px solid #d6d3d1",
            borderRadius: "6px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label
            style={{ fontSize: "0.85rem", color: "#57534e", fontWeight: "500" }}
          >
            Status:
          </label>
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
              backgroundColor: "#fff",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div
        className="admin-table-container"
        style={{
          backgroundColor: "#fff",
          border: "1px solid var(--border-subtle, #e7e5e4)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount</th>
                <th>Scope / Applicable To</th>
                <th>Validity Period</th>
                <th>Redeemed</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "2.5rem" }}
                  >
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#78716c",
                    }}
                  >
                    No coupons found. Click "+ Create Coupon" to add your first
                    promotion.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: "700",
                            letterSpacing: "0.05em",
                            color: "#1c1917",
                          }}
                        >
                          {c.code}
                        </span>
                        {c.description && (
                          <span
                            style={{ fontSize: "0.78rem", color: "#78716c" }}
                          >
                            {c.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "600" }}>
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}% OFF${c.maxDiscountAmount ? ` (Max ₹${c.maxDiscountAmount})` : ""}`
                          : `₹${c.discountValue} FLAT OFF`}
                      </span>
                      {c.minPurchaseAmount > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "#78716c" }}>
                          Min. Order: ₹{c.minPurchaseAmount}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.applicabilityType === "ALL" ? (
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "#2563eb",
                            fontWeight: "500",
                          }}
                        >
                          Store-wide (All Items)
                        </span>
                      ) : c.applicabilityType === "CATEGORY" ? (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ fontWeight: "600", color: "#7c3aed" }}>
                            Specific Categories:
                          </span>
                          <div
                            style={{
                              color: "#57534e",
                              fontSize: "0.78rem",
                              marginTop: "2px",
                            }}
                          >
                            {c.applicableCategories
                              ?.map((cat) => cat.name)
                              .join(", ") || "None"}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ fontWeight: "600", color: "#0891b2" }}>
                            Specific Products:
                          </span>
                          <div
                            style={{
                              color: "#57534e",
                              fontSize: "0.78rem",
                              marginTop: "2px",
                            }}
                          >
                            {c.applicableProducts
                              ?.map((p) => p.name)
                              .join(", ") || "None"}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", color: "#44403c" }}>
                        <div>
                          From: {new Date(c.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          To: {new Date(c.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "600" }}>
                        {c.usedCount || 0}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#78716c",
                          marginLeft: "4px",
                        }}
                      >
                        times
                      </span>
                    </td>
                    <td>
                      {getValidityBadge(c.startDate, c.endDate, c.isActive)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="admin-modal-confirm-btn"
                          style={{
                            backgroundColor: c.isActive ? "#fee2e2" : "#dcfce7",
                            color: c.isActive ? "#991b1b" : "#166534",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                          }}
                          disabled={actionLoadingId === c._id}
                          onClick={() => handleToggleStatus(c)}
                        >
                          {actionLoadingId === c._id
                            ? "..."
                            : c.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="admin-modal-confirm-btn btn-confirm-block"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          disabled={actionLoadingId === c._id}
                          onClick={() =>
                            setDeleteConfirmModal({ isOpen: true, coupon: c })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: "1rem" }}>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {isCreateModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="admin-modal-box"
            style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title" style={{ marginBottom: "1rem" }}>
              Create New Coupon
            </h2>

            {formError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateCoupon}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Code & Description */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. SUMMER25"
                    value={formData.code}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. 25% Off Summer Collection"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    {formData.discountType === "PERCENTAGE"
                      ? "Discount Percentage (%) *"
                      : "Discount Amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    required
                    min="1"
                    max={
                      formData.discountType === "PERCENTAGE" ? "100" : undefined
                    }
                    placeholder={
                      formData.discountType === "PERCENTAGE"
                        ? "e.g. 20"
                        : "e.g. 500"
                    }
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Cap & Min Purchase */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {formData.discountType === "PERCENTAGE" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                    >
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      placeholder="e.g. 1000 (Optional)"
                      value={formData.maxDiscountAmount}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #d6d3d1",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}
                <div
                  style={{
                    gridColumn:
                      formData.discountType !== "PERCENTAGE"
                        ? "span 2"
                        : "auto",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    Minimum Purchase Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minPurchaseAmount"
                    placeholder="e.g. 1500 (0 for no minimum)"
                    value={formData.minPurchaseAmount}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #d6d3d1",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Applicability Scope */}
              <div
                style={{
                  borderTop: "1px solid #e7e5e4",
                  paddingTop: "0.75rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "0.5rem",
                  }}
                >
                  Applicable Products / Restrictions
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="applicabilityType"
                      value="ALL"
                      checked={formData.applicabilityType === "ALL"}
                      onChange={handleInputChange}
                    />
                    <span>Entire Store (All Products)</span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="applicabilityType"
                      value="CATEGORY"
                      checked={formData.applicabilityType === "CATEGORY"}
                      onChange={handleInputChange}
                    />
                    <span>Specific Categories</span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="applicabilityType"
                      value="PRODUCT"
                      checked={formData.applicabilityType === "PRODUCT"}
                      onChange={handleInputChange}
                    />
                    <span>Specific Products</span>
                  </label>
                </div>

                {/* Categories Picker */}
                {formData.applicabilityType === "CATEGORY" && (
                  <div
                    style={{
                      border: "1px solid #e7e5e4",
                      borderRadius: "6px",
                      padding: "0.75rem",
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "#78716c",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Select which categories this coupon applies to:
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                      }}
                    >
                      {availableCategories.map((cat) => (
                        <label
                          key={cat._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.applicableCategories.includes(
                              cat._id,
                            )}
                            onChange={() => toggleCategorySelection(cat._id)}
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Picker */}
                {formData.applicabilityType === "PRODUCT" && (
                  <div
                    style={{
                      border: "1px solid #e7e5e4",
                      borderRadius: "6px",
                      padding: "0.75rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Filter products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.82rem",
                        border: "1px solid #d6d3d1",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    />
                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      {availableProducts
                        .filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        )
                        .map((prod) => (
                          <label
                            key={prod._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.82rem",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.applicableProducts.includes(
                                prod._id,
                              )}
                              onChange={() => toggleProductSelection(prod._id)}
                            />
                            <span>{prod.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div
                className="admin-modal-actions"
                style={{ marginTop: "1rem" }}
              >
                <button
                  type="button"
                  className="admin-modal-confirm-btn"
                  style={{ backgroundColor: "#f5f5f4", color: "#44403c" }}
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Creating..." : "Save Coupon"}
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
          onClick={() => setDeleteConfirmModal({ isOpen: false, coupon: null })}
        >
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Delete Coupon</h2>
            <p className="admin-modal-message">
              Are you sure you want to delete coupon{" "}
              <strong>"{deleteConfirmModal.coupon?.code}"</strong>? Customers
              will no longer be able to redeem this code.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-confirm-btn"
                style={{ backgroundColor: "#f5f5f4", color: "#44403c" }}
                onClick={() =>
                  setDeleteConfirmModal({ isOpen: false, coupon: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm-btn btn-confirm-block"
                onClick={handleDeleteCoupon}
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

export default AdminCouponsPage;
