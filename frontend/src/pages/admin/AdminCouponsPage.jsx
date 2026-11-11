import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponStatus,
  deleteAdminCoupon,
  getAdminCategories,
  getAdminProducts,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminCouponsPage.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
  { value: "expired", label: "Expired Only" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

  // Status Filter in Toolbar
  const [openDropdown, setOpenDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  // In-DOM Discount Type Dropdown in Modal
  const [openDiscountDropdown, setOpenDiscountDropdown] = useState(false);
  const discountDropdownRef = useRef(null);

  // In-DOM Date Pickers in Modal
  const [openDatePicker, setOpenDatePicker] = useState(null); // 'start' | 'end' | null
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const [calendarView, setCalendarView] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  // Close dropdowns & datepickers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(false);
      }
      if (
        discountDropdownRef.current &&
        !discountDropdownRef.current.contains(event.target)
      ) {
        setOpenDiscountDropdown(false);
      }
      if (
        startDatePickerRef.current &&
        !startDatePickerRef.current.contains(event.target) &&
        openDatePicker === "start"
      ) {
        setOpenDatePicker(null);
      }
      if (
        endDatePickerRef.current &&
        !endDatePickerRef.current.contains(event.target) &&
        openDatePicker === "end"
      ) {
        setOpenDatePicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDatePicker]);

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ||
    "All Statuses";

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    coupon: null,
  });
  const [statusConfirmModal, setStatusConfirmModal] = useState({
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

  // Format date display for in-DOM trigger button
  const formatDisplayDateTime = (isoString) => {
    if (!isoString) return "Select Date & Time";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const monthName = MONTH_NAMES[d.getMonth()]?.slice(0, 3) || "";
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
  };

  // Open / Toggle Date Picker
  const handleOpenDatePicker = (type) => {
    const currentIso = type === "start" ? formData.startDate : formData.endDate;
    const d = currentIso ? new Date(currentIso) : new Date();
    if (!isNaN(d.getTime())) {
      setCalendarView({ year: d.getFullYear(), month: d.getMonth() });
    }
    setOpenDatePicker((prev) => (prev === type ? null : type));
  };

  const handlePrevMonth = () => {
    setCalendarView((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCalendarView((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleSelectDay = (day) => {
    const targetKey = openDatePicker === "start" ? "startDate" : "endDate";
    const currentIso = formData[targetKey];
    let hours = "00";
    let minutes = "00";
    if (currentIso) {
      const cur = new Date(currentIso);
      if (!isNaN(cur.getTime())) {
        hours = String(cur.getHours()).padStart(2, "0");
        minutes = String(cur.getMinutes()).padStart(2, "0");
      }
    } else if (openDatePicker === "end") {
      hours = "23";
      minutes = "59";
    }

    const mm = String(calendarView.month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const newIso = `${calendarView.year}-${mm}-${dd}T${hours}:${minutes}`;

    setFormData((prev) => ({ ...prev, [targetKey]: newIso }));
  };

  const handleTimeChange = (type, unit, val) => {
    const targetKey = type === "start" ? "startDate" : "endDate";
    const currentIso = formData[targetKey];
    const d = currentIso ? new Date(currentIso) : new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();

    if (unit === "hours") {
      const h = Math.min(23, Math.max(0, parseInt(val, 10) || 0));
      hours = h;
    } else {
      const m = Math.min(59, Math.max(0, parseInt(val, 10) || 0));
      minutes = m;
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(hours).padStart(2, "0");
    const minStr = String(minutes).padStart(2, "0");

    setFormData((prev) => ({
      ...prev,
      [targetKey]: `${yyyy}-${mm}-${dd}T${hh}:${minStr}`,
    }));
  };

  const handleApplyPreset = (type, offsetDays) => {
    const targetKey = type === "start" ? "startDate" : "endDate";
    let baseDate = new Date();
    if (type === "end" && formData.startDate) {
      const s = new Date(formData.startDate);
      if (!isNaN(s.getTime())) baseDate = s;
    }
    const targetDate = new Date(
      baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000,
    );
    if (type === "end") {
      targetDate.setHours(23, 59, 0, 0);
    }
    const iso = targetDate.toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, [targetKey]: iso }));
    setCalendarView({
      year: targetDate.getFullYear(),
      month: targetDate.getMonth(),
    });
  };

  const renderCalendarGrid = (pickerType) => {
    const targetKey = pickerType === "start" ? "startDate" : "endDate";
    const selectedDate = formData[targetKey]
      ? new Date(formData[targetKey])
      : null;
    const today = new Date();

    const daysCount = new Date(
      calendarView.year,
      calendarView.month + 1,
      0,
    ).getDate();
    const firstDayIndex = new Date(
      calendarView.year,
      calendarView.month,
      1,
    ).getDay();

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    return (
      <div className="admin-datepicker-grid">
        {DAY_LABELS.map((d) => (
          <span key={d} className="admin-datepicker-day-name">
            {d}
          </span>
        ))}
        {blanks.map((b) => (
          <div key={`blank-${b}`} />
        ))}
        {days.map((day) => {
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === calendarView.year &&
            selectedDate.getMonth() === calendarView.month &&
            selectedDate.getDate() === day;

          const isToday =
            today.getFullYear() === calendarView.year &&
            today.getMonth() === calendarView.month &&
            today.getDate() === day;

          return (
            <button
              key={day}
              type="button"
              className={`admin-datepicker-day-btn ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
              onClick={() => handleSelectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  const renderTimeControls = (pickerType) => {
    const targetKey = pickerType === "start" ? "startDate" : "endDate";
    const currentIso = formData[targetKey];
    const d = currentIso ? new Date(currentIso) : new Date();
    const hours = isNaN(d.getTime())
      ? "00"
      : String(d.getHours()).padStart(2, "0");
    const minutes = isNaN(d.getTime())
      ? "00"
      : String(d.getMinutes()).padStart(2, "0");

    return (
      <div className="admin-datepicker-time-row">
        <span className="admin-datepicker-time-label">Time (24h):</span>
        <div className="admin-datepicker-time-inputs">
          <input
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={(e) =>
              handleTimeChange(pickerType, "hours", e.target.value)
            }
            className="admin-datepicker-time-input"
            aria-label="Hours"
          />
          <span>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) =>
              handleTimeChange(pickerType, "minutes", e.target.value)
            }
            className="admin-datepicker-time-input"
            aria-label="Minutes"
          />
        </div>
        <button
          type="button"
          className="admin-datepicker-done-btn"
          style={{ width: "auto", margin: 0, padding: "0.25rem 0.65rem" }}
          onClick={() => setOpenDatePicker(null)}
        >
          Done
        </button>
      </div>
    );
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
        <span className="admin-status-badge status-upcoming">
          <span className="status-dot"></span> Upcoming
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
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Coupons & Promotions</h1>
          <p className="admin-page-subtitle">
            Create and manage discount codes, validity windows, and
            applicability rules.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-create-coupon"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <span>+ Create Coupon</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Coupons</span>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Currently Active</span>
          <div className="admin-stat-value admin-stat-active">{stats.active}</div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Expired</span>
          <div className="admin-stat-value admin-stat-expired">{stats.expired}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-table-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by code (e.g. SUMMER20)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-coupon-dropdown-wrap" ref={filterDropdownRef}>
          <button
            type="button"
            className="admin-coupon-dropdown-btn"
            onClick={() => setOpenDropdown((prev) => !prev)}
            aria-expanded={openDropdown}
          >
            <span className="admin-coupon-dropdown-btn-text">
              Status: <strong>{currentStatusLabel}</strong>
            </span>
            <span
              className={`admin-dropdown-chevron ${openDropdown ? "open" : ""}`}
            >
              ▼
            </span>
          </button>

          {openDropdown && (
            <div className="admin-coupon-dropdown-menu">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`admin-coupon-dropdown-item ${statusFilter === opt.value ? "selected" : ""}`}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setCurrentPage(1);
                    setOpenDropdown(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {statusFilter === opt.value && (
                    <span className="admin-coupon-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coupons Table */}
      {/* Coupons Table */}
      <div className="admin-table-container">
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
                  <td colSpan="7" className="admin-empty-state-cell">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state-cell">
                    <div className="admin-empty-state-content">
                      <div className="admin-empty-icon">🏷️</div>
                      <h3 className="admin-empty-title">No coupons found</h3>
                      <p className="admin-empty-desc">
                        {search || statusFilter !== "all"
                          ? "No coupons match your search and filter criteria."
                          : "Click '+ Create Coupon' above to create your first discount promotional code."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="coupon-code-wrap">
                        <span className="coupon-code-text">{c.code}</span>
                        {c.description && (
                          <span className="coupon-desc-text">
                            {c.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="coupon-discount-text">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}% OFF${c.maxDiscountAmount ? ` (Max ₹${c.maxDiscountAmount})` : ""}`
                          : `₹${c.discountValue} FLAT OFF`}
                      </span>
                      {c.minPurchaseAmount > 0 && (
                        <div className="coupon-min-order">
                          Min. Order: ₹{c.minPurchaseAmount}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.applicabilityType === "ALL" ? (
                        <span className="coupon-scope-store">
                          Store-wide (All Items)
                        </span>
                      ) : c.applicabilityType === "CATEGORY" ? (
                        <div>
                          <span className="coupon-scope-category">
                            Specific Categories:
                          </span>
                          <div className="coupon-scope-names">
                            {c.applicableCategories
                              ?.map((cat) => cat.name)
                              .join(", ") || "None"}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="coupon-scope-product">
                            Specific Products:
                          </span>
                          <div className="coupon-scope-names">
                            {c.applicableProducts
                              ?.map((p) => p.name)
                              .join(", ") || "None"}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="coupon-dates-text">
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
                      <div className="admin-coupon-actions">
                        <button
                          type="button"
                          className={`admin-btn-action-toggle ${c.isActive ? "deactivate" : "activate"}`}
                          disabled={actionLoadingId === c._id}
                          onClick={() =>
                            setStatusConfirmModal({ isOpen: true, coupon: c })
                          }
                        >
                          {actionLoadingId === c._id
                            ? "..."
                            : c.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="admin-btn-action-delete"
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
            className="admin-coupon-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Create New Coupon</h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: "contents" }}>
              <div className="admin-coupon-modal-body">
                {formError && (
                  <div className="admin-coupon-error-banner">{formError}</div>
                )}

                {/* Code & Description */}
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Coupon Code *</label>
                    <input
                      type="text"
                      name="code"
                      required
                      placeholder="e.g. SUMMER25"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="admin-form-input uppercase"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g. 25% Off Summer Collection"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="admin-form-input"
                    />
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Type *</label>
                    <div
                      className="admin-coupon-dropdown-wrap"
                      ref={discountDropdownRef}
                    >
                      <button
                        type="button"
                        className="admin-form-input admin-in-dom-select-btn"
                        onClick={() => setOpenDiscountDropdown((prev) => !prev)}
                        aria-expanded={openDiscountDropdown}
                      >
                        <span>
                          {formData.discountType === "PERCENTAGE"
                            ? "Percentage (%)"
                            : "Flat Amount (₹)"}
                        </span>
                        <span
                          className={`admin-dropdown-chevron ${openDiscountDropdown ? "open" : ""}`}
                        >
                          ▼
                        </span>
                      </button>
                      {openDiscountDropdown && (
                        <div
                          className="admin-coupon-dropdown-menu"
                          style={{ width: "100%", left: 0, right: 0 }}
                        >
                          <button
                            type="button"
                            className={`admin-coupon-dropdown-item ${formData.discountType === "PERCENTAGE" ? "selected" : ""}`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                discountType: "PERCENTAGE",
                              }));
                              setOpenDiscountDropdown(false);
                            }}
                          >
                            <span>Percentage (%)</span>
                            {formData.discountType === "PERCENTAGE" && (
                              <span className="admin-coupon-check">✓</span>
                            )}
                          </button>
                          <button
                            type="button"
                            className={`admin-coupon-dropdown-item ${formData.discountType === "FLAT" ? "selected" : ""}`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                discountType: "FLAT",
                              }));
                              setOpenDiscountDropdown(false);
                            }}
                          >
                            <span>Flat Amount (₹)</span>
                            {formData.discountType === "FLAT" && (
                              <span className="admin-coupon-check">✓</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
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
                        formData.discountType === "PERCENTAGE"
                          ? 100
                          : undefined
                      }
                      placeholder={
                        formData.discountType === "PERCENTAGE"
                          ? "e.g. 20"
                          : "e.g. 500"
                      }
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      className="admin-form-input"
                    />
                  </div>
                </div>

                {/* Cap & Min Purchase */}
                <div className="admin-form-grid-2">
                  {formData.discountType === "PERCENTAGE" && (
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Max Discount Cap (₹)
                      </label>
                      <input
                        type="number"
                        name="maxDiscountAmount"
                        placeholder="e.g. 1000 (Optional)"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        className="admin-form-input"
                      />
                    </div>
                  )}
                  <div
                    className="admin-form-group"
                    style={{
                      gridColumn:
                        formData.discountType !== "PERCENTAGE"
                          ? "1 / -1"
                          : "auto",
                    }}
                  >
                    <label className="admin-form-label">
                      Minimum Purchase Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="minPurchaseAmount"
                      placeholder="e.g. 1500 (0 for no minimum)"
                      value={formData.minPurchaseAmount}
                      onChange={handleInputChange}
                      className="admin-form-input"
                    />
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="admin-form-grid-2">
                  {/* Start Date */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Start Date & Time *
                    </label>
                    <div
                      className="admin-datepicker-wrap"
                      ref={startDatePickerRef}
                    >
                      <button
                        type="button"
                        className={`admin-datepicker-btn ${openDatePicker === "start" ? "active" : ""}`}
                        onClick={() => handleOpenDatePicker("start")}
                        aria-expanded={openDatePicker === "start"}
                      >
                        <span>
                          📅 {formatDisplayDateTime(formData.startDate)}
                        </span>
                        <span
                          className={`admin-dropdown-chevron ${openDatePicker === "start" ? "open" : ""}`}
                        >
                          ▼
                        </span>
                      </button>

                      {openDatePicker === "start" && (
                        <div className="admin-datepicker-popover">
                          <div className="admin-datepicker-header">
                            <button
                              type="button"
                              className="admin-datepicker-nav-btn"
                              onClick={handlePrevMonth}
                              aria-label="Previous Month"
                            >
                              ‹
                            </button>
                            <span className="admin-datepicker-title">
                              {MONTH_NAMES[calendarView.month]}{" "}
                              {calendarView.year}
                            </span>
                            <button
                              type="button"
                              className="admin-datepicker-nav-btn"
                              onClick={handleNextMonth}
                              aria-label="Next Month"
                            >
                              ›
                            </button>
                          </div>

                          <div className="admin-datepicker-presets">
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("start", 0)}
                            >
                              Now
                            </button>
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("start", 1)}
                            >
                              Tomorrow
                            </button>
                          </div>

                          {renderCalendarGrid("start")}
                          {renderTimeControls("start")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      End Date & Time *
                    </label>
                    <div
                      className="admin-datepicker-wrap"
                      ref={endDatePickerRef}
                    >
                      <button
                        type="button"
                        className={`admin-datepicker-btn ${openDatePicker === "end" ? "active" : ""}`}
                        onClick={() => handleOpenDatePicker("end")}
                        aria-expanded={openDatePicker === "end"}
                      >
                        <span>
                          📅 {formatDisplayDateTime(formData.endDate)}
                        </span>
                        <span
                          className={`admin-dropdown-chevron ${openDatePicker === "end" ? "open" : ""}`}
                        >
                          ▼
                        </span>
                      </button>

                      {openDatePicker === "end" && (
                        <div className="admin-datepicker-popover">
                          <div className="admin-datepicker-header">
                            <button
                              type="button"
                              className="admin-datepicker-nav-btn"
                              onClick={handlePrevMonth}
                              aria-label="Previous Month"
                            >
                              ‹
                            </button>
                            <span className="admin-datepicker-title">
                              {MONTH_NAMES[calendarView.month]}{" "}
                              {calendarView.year}
                            </span>
                            <button
                              type="button"
                              className="admin-datepicker-nav-btn"
                              onClick={handleNextMonth}
                              aria-label="Next Month"
                            >
                              ›
                            </button>
                          </div>

                          <div className="admin-datepicker-presets">
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("end", 3)}
                            >
                              +3 Days
                            </button>
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("end", 7)}
                            >
                              +7 Days
                            </button>
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("end", 14)}
                            >
                              +14 Days
                            </button>
                            <button
                              type="button"
                              className="admin-datepicker-preset-btn"
                              onClick={() => handleApplyPreset("end", 30)}
                            >
                              +30 Days
                            </button>
                          </div>

                          {renderCalendarGrid("end")}
                          {renderTimeControls("end")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applicability Scope */}
                <div className="admin-applicability-box">
                  <label
                    className="admin-form-label"
                    style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}
                  >
                    Applicable Products / Restrictions
                  </label>
                  <div className="admin-applicability-radio-group">
                    <label className="admin-radio-label">
                      <input
                        type="radio"
                        name="applicabilityType"
                        value="ALL"
                        checked={formData.applicabilityType === "ALL"}
                        onChange={handleInputChange}
                      />
                      <span>Entire Store (All Products)</span>
                    </label>
                    <label className="admin-radio-label">
                      <input
                        type="radio"
                        name="applicabilityType"
                        value="CATEGORY"
                        checked={formData.applicabilityType === "CATEGORY"}
                        onChange={handleInputChange}
                      />
                      <span>Specific Categories</span>
                    </label>
                    <label className="admin-radio-label">
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
                    <div className="admin-picker-container">
                      <span className="admin-picker-help">
                        Select which categories this coupon applies to:
                      </span>
                      <div className="admin-category-checkbox-grid">
                        {availableCategories.map((cat) => (
                          <label
                            key={cat._id}
                            className="admin-checkbox-label"
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
                    <div className="admin-picker-container">
                      <input
                        type="text"
                        placeholder="Filter products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="admin-product-picker-search"
                      />
                      <div className="admin-product-checkbox-list">
                        {availableProducts
                          .filter((p) =>
                            p.name
                              .toLowerCase()
                              .includes(productSearch.toLowerCase()),
                          )
                          .map((prod) => (
                            <label
                              key={prod._id}
                              className="admin-checkbox-label"
                            >
                              <input
                                type="checkbox"
                                checked={formData.applicableProducts.includes(
                                  prod._id,
                                )}
                                onChange={() =>
                                  toggleProductSelection(prod._id)
                                }
                              />
                              <span>{prod.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="admin-coupon-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
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
          <div
            className="admin-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">Delete Coupon</h2>
            <p className="admin-confirm-modal-msg">
              Are you sure you want to delete coupon{" "}
              <strong>"{deleteConfirmModal.coupon?.code}"</strong>? Customers
              will no longer be able to redeem this code.
            </p>
            <div className="admin-confirm-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setDeleteConfirmModal({ isOpen: false, coupon: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-danger"
                onClick={handleDeleteCoupon}
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CONFIRMATION MODAL */}
      {statusConfirmModal.isOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setStatusConfirmModal({ isOpen: false, coupon: null })}
        >
          <div
            className="admin-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">
              {statusConfirmModal.coupon?.isActive
                ? "Deactivate Coupon"
                : "Activate Coupon"}
            </h2>
            <p className="admin-confirm-modal-msg">
              {statusConfirmModal.coupon?.isActive ? (
                <>
                  Are you sure you want to deactivate coupon{" "}
                  <strong>"{statusConfirmModal.coupon?.code}"</strong>? Customers
                  will no longer be able to redeem this code until reactivated.
                </>
              ) : (
                <>
                  Are you sure you want to activate coupon{" "}
                  <strong>"{statusConfirmModal.coupon?.code}"</strong>? Customers
                  will immediately be able to redeem this code.
                </>
              )}
            </p>
            <div className="admin-confirm-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setStatusConfirmModal({ isOpen: false, coupon: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  statusConfirmModal.coupon?.isActive
                    ? "admin-btn-danger"
                    : "admin-btn-primary"
                }
                onClick={async () => {
                  const targetCoupon = statusConfirmModal.coupon;
                  setStatusConfirmModal({ isOpen: false, coupon: null });
                  if (targetCoupon) {
                    await handleToggleStatus(targetCoupon);
                  }
                }}
                disabled={actionLoadingId !== null}
              >
                {statusConfirmModal.coupon?.isActive
                  ? "Confirm Deactivate"
                  : "Confirm Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
