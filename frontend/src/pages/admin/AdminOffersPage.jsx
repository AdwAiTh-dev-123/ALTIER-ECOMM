import React, { useState, useEffect, useCallback, useRef } from "react";
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
import "../../styles/admins/AdminOffersPage.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
  { value: "expired", label: "Expired Only" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "discount-high", label: "Highest Discount" },
  { value: "discount-low", label: "Lowest Discount" },
];

const OFFER_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Offers" },
  { value: "PRODUCT", label: "Product Deals" },
  { value: "CATEGORY", label: "Category Promotions" },
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

  // In-DOM Toolbar Dropdowns
  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  const [openSortDropdown, setOpenSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  const [openOfferTypeFilterDropdown, setOpenOfferTypeFilterDropdown] =
    useState(false);
  const offerTypeFilterDropdownRef = useRef(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusConfirmModal, setStatusConfirmModal] = useState({
    isOpen: false,
    offer: null,
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    offer: null,
  });
  const [editingOfferId, setEditingOfferId] = useState(null);

  // In-DOM Modal Dropdowns
  const [openOfferTypeDropdown, setOpenOfferTypeDropdown] = useState(false);
  const offerTypeDropdownRef = useRef(null);

  const [openTargetDropdown, setOpenTargetDropdown] = useState(false);
  const targetDropdownRef = useRef(null);
  const [targetSearch, setTargetSearch] = useState("");

  // In-DOM Date Pickers in Modal
  const [openDatePicker, setOpenDatePicker] = useState(null); // 'start' | 'end' | null
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const [calendarView, setCalendarView] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

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

  // Close dropdowns & datepickers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setOpenStatusDropdown(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setOpenSortDropdown(false);
      }
      if (
        offerTypeFilterDropdownRef.current &&
        !offerTypeFilterDropdownRef.current.contains(event.target)
      ) {
        setOpenOfferTypeFilterDropdown(false);
      }
      if (
        offerTypeDropdownRef.current &&
        !offerTypeDropdownRef.current.contains(event.target)
      ) {
        setOpenOfferTypeDropdown(false);
      }
      if (
        targetDropdownRef.current &&
        !targetDropdownRef.current.contains(event.target)
      ) {
        setOpenTargetDropdown(false);
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

  // Date Picker Formatting & Handlers
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

      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      let res;
      if (editingOfferId) {
        res = await updateAdminOffer(editingOfferId, payload);
        showToast(`Offer "${formData.name}" updated successfully!`);
      } else {
        res = await createAdminOffer(payload);
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
    setTargetSearch("");
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
    setTargetSearch("");
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

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ||
    "All Statuses";

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || "Newest First";

  const currentOfferTypeFilterLabel =
    OFFER_TYPE_FILTER_OPTIONS.find((opt) => opt.value === offerTypeFilter)
      ?.label || "All Offers";

  // Selected Target Name lookup
  const selectedProductName =
    products.find((p) => p._id === formData.productId)?.name ||
    "-- Choose a product --";

  const selectedCategoryName =
    categories.find((c) => c._id === formData.categoryId)?.name ||
    "-- Choose a category --";

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
          className="admin-btn-create-offer"
          onClick={handleOpenCreateModal}
        >
          <span>+ Add New Offer</span>
        </button>
      </div>

      {/* 1. Quick Stats Overview */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Offers</span>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Currently Active</span>
          <div className="admin-stat-value admin-stat-active">
            {stats.active}
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Expired</span>
          <div className="admin-stat-value admin-stat-expired">
            {stats.expired}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="admin-table-toolbar">
        {/* Search input */}
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search offers by title..."
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

        {/* Filters & Sorting Controls */}
        <div className="admin-toolbar-controls">
          {/* Mobile-only Offer Type Filter Dropdown */}
          <div
            className="admin-offer-dropdown-wrap admin-offer-type-mobile-wrap"
            ref={offerTypeFilterDropdownRef}
          >
            <button
              type="button"
              className="admin-offer-dropdown-btn"
              onClick={() => setOpenOfferTypeFilterDropdown((prev) => !prev)}
              aria-expanded={openOfferTypeFilterDropdown}
            >
              <span className="admin-offer-dropdown-btn-text">
                Type: <strong>{currentOfferTypeFilterLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openOfferTypeFilterDropdown ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {openOfferTypeFilterDropdown && (
              <div className="admin-offer-dropdown-menu">
                {OFFER_TYPE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-offer-dropdown-item ${offerTypeFilter === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setOfferTypeFilter(opt.value);
                      setCurrentPage(1);
                      setOpenOfferTypeFilterDropdown(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {offerTypeFilter === opt.value && (
                      <span className="admin-offer-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="admin-offer-dropdown-wrap" ref={statusDropdownRef}>
            <button
              type="button"
              className="admin-offer-dropdown-btn"
              onClick={() => setOpenStatusDropdown((prev) => !prev)}
              aria-expanded={openStatusDropdown}
            >
              <span className="admin-offer-dropdown-btn-text">
                Status: <strong>{currentStatusLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openStatusDropdown ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {openStatusDropdown && (
              <div className="admin-offer-dropdown-menu">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-offer-dropdown-item ${statusFilter === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setCurrentPage(1);
                      setOpenStatusDropdown(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && (
                      <span className="admin-offer-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="admin-offer-dropdown-wrap" ref={sortDropdownRef}>
            <button
              type="button"
              className="admin-offer-dropdown-btn"
              onClick={() => setOpenSortDropdown((prev) => !prev)}
              aria-expanded={openSortDropdown}
            >
              <span className="admin-offer-dropdown-btn-text">
                Sort: <strong>{currentSortLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openSortDropdown ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {openSortDropdown && (
              <div className="admin-offer-dropdown-menu">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`admin-offer-dropdown-item ${sortBy === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setSortBy(opt.value);
                      setCurrentPage(1);
                      setOpenSortDropdown(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && (
                      <span className="admin-offer-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          {(search ||
            statusFilter !== "all" ||
            offerTypeFilter !== "all" ||
            sortBy !== "newest") && (
            <button
              type="button"
              className="admin-btn-clear-filters"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setOfferTypeFilter("all");
                setSortBy("newest");
                setCurrentPage(1);
              }}
            >
              <span>Clear Filters ✕</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Offer Type Pill Buttons (Desktop Only) */}
      <div className="admin-filters-bar admin-filters-bar-desktop">
        <button
          type="button"
          className={`filter-pill-btn ${offerTypeFilter === "all" ? "active" : ""}`}
          onClick={() => {
            setOfferTypeFilter("all");
            setCurrentPage(1);
          }}
        >
          All Offers
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${offerTypeFilter === "PRODUCT" ? "active" : ""}`}
          onClick={() => {
            setOfferTypeFilter("PRODUCT");
            setCurrentPage(1);
          }}
        >
          Product Deals
        </button>
        <button
          type="button"
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
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer Details</th>
                <th>Type</th>
                <th>Applied Target</th>
                <th>Discount</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || tableLoading ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state-cell">
                    Loading offers...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state-cell">
                    <div className="admin-empty-state-content">
                      <div className="admin-empty-icon">🎁</div>
                      <h3 className="admin-empty-title">
                        No promotional offers found
                      </h3>
                      <p className="admin-empty-desc">
                        {search ||
                        statusFilter !== "all" ||
                        offerTypeFilter !== "all"
                          ? "No offers match your current filter parameters."
                          : "Click '+ Add New Offer' above to launch your first promotional discount."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
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
                        <span className="discount-tag">
                          {offer.discountPercentage}% OFF
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: expired ? "#b91c1c" : "#44403c",
                          }}
                        >
                          <div>
                            From:{" "}
                            {new Date(offer.startDate).toLocaleDateString()}
                          </div>
                          <div>
                            To: {new Date(offer.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        {expired && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#b91c1c",
                              fontWeight: 600,
                              marginTop: "2px",
                            }}
                          >
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
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell-flex">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => handleOpenEditModal(offer)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn-action-text ${offer.isActive ? "deactivate" : "activate"}`}
                            disabled={actionLoadingId === offer._id}
                            onClick={() =>
                              setStatusConfirmModal({ isOpen: true, offer })
                            }
                          >
                            {actionLoadingId === offer._id
                              ? "..."
                              : offer.isActive
                                ? "Deactivate"
                                : "Activate"}
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
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: "1rem" }}>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              limit={pagination.limit}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* CREATE / EDIT OFFER MODAL */}
      {isCreateModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="admin-offer-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingOfferId ? "Edit Offer" : "Create New Offer"}
              </h2>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: "contents" }}>
              <div className="admin-offer-modal-body">
                {formError && (
                  <div className="admin-offer-error-banner">{formError}</div>
                )}

                {/* Offer Title */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Offer Title *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Summer Flash Sale"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    required
                  />
                </div>

                {/* Offer Type & Target */}
                <div className="admin-form-grid-2">
                  {/* Offer Type Dropdown */}
                  <div className="admin-form-group" ref={offerTypeDropdownRef}>
                    <label className="admin-form-label">Offer Type *</label>
                    <button
                      type="button"
                      className="admin-form-input admin-in-dom-select-btn"
                      onClick={() => setOpenOfferTypeDropdown((prev) => !prev)}
                      aria-expanded={openOfferTypeDropdown}
                    >
                      <span>
                        {formData.offerType === "PRODUCT"
                          ? "Product Offer"
                          : "Category Offer"}
                      </span>
                      <span
                        className={`admin-dropdown-chevron ${openOfferTypeDropdown ? "open" : ""}`}
                      >
                        ▼
                      </span>
                    </button>
                    {openOfferTypeDropdown && (
                      <div
                        className="admin-offer-dropdown-menu"
                        style={{ width: "100%", left: 0, right: 0 }}
                      >
                        <button
                          type="button"
                          className={`admin-offer-dropdown-item ${formData.offerType === "PRODUCT" ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              offerType: "PRODUCT",
                              categoryId: "",
                            }));
                            setOpenOfferTypeDropdown(false);
                          }}
                        >
                          <span>Product Offer</span>
                          {formData.offerType === "PRODUCT" && (
                            <span className="admin-offer-check">✓</span>
                          )}
                        </button>
                        <button
                          type="button"
                          className={`admin-offer-dropdown-item ${formData.offerType === "CATEGORY" ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              offerType: "CATEGORY",
                              productId: "",
                            }));
                            setOpenOfferTypeDropdown(false);
                          }}
                        >
                          <span>Category Offer</span>
                          {formData.offerType === "CATEGORY" && (
                            <span className="admin-offer-check">✓</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Target Searchable Dropdown */}
                  <div className="admin-form-group" ref={targetDropdownRef}>
                    <label className="admin-form-label">
                      {formData.offerType === "PRODUCT"
                        ? "Target Product *"
                        : "Target Category *"}
                    </label>
                    <button
                      type="button"
                      className="admin-form-input admin-in-dom-select-btn"
                      onClick={() => setOpenTargetDropdown((prev) => !prev)}
                      aria-expanded={openTargetDropdown}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formData.offerType === "PRODUCT"
                          ? selectedProductName
                          : selectedCategoryName}
                      </span>
                      <span
                        className={`admin-dropdown-chevron ${openTargetDropdown ? "open" : ""}`}
                      >
                        ▼
                      </span>
                    </button>

                    {openTargetDropdown && (
                      <div className="admin-searchable-picker-menu">
                        <input
                          type="text"
                          placeholder={
                            formData.offerType === "PRODUCT"
                              ? "Search product..."
                              : "Search category..."
                          }
                          value={targetSearch}
                          onChange={(e) => setTargetSearch(e.target.value)}
                          className="admin-picker-search-field"
                          autoFocus
                        />
                        <div className="admin-picker-options-list">
                          {formData.offerType === "PRODUCT"
                            ? products
                                .filter((p) =>
                                  p.name
                                    .toLowerCase()
                                    .includes(targetSearch.toLowerCase()),
                                )
                                .map((p) => (
                                  <button
                                    key={p._id}
                                    type="button"
                                    className={`admin-picker-option-item ${formData.productId === p._id ? "selected" : ""}`}
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        productId: p._id,
                                      }));
                                      setOpenTargetDropdown(false);
                                      setTargetSearch("");
                                    }}
                                  >
                                    <span>{p.name}</span>
                                    {formData.productId === p._id && (
                                      <span className="admin-offer-check">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                ))
                            : categories
                                .filter((c) =>
                                  c.name
                                    .toLowerCase()
                                    .includes(targetSearch.toLowerCase()),
                                )
                                .map((c) => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    className={`admin-picker-option-item ${formData.categoryId === c._id ? "selected" : ""}`}
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        categoryId: c._id,
                                      }));
                                      setOpenTargetDropdown(false);
                                      setTargetSearch("");
                                    }}
                                  >
                                    <span>{c.name}</span>
                                    {formData.categoryId === c._id && (
                                      <span className="admin-offer-check">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount Percentage */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Discount Percentage (%) *
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    min="1"
                    max="90"
                    placeholder="e.g. 20"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    required
                  />
                </div>

                {/* Validity Dates (In-DOM Custom Date Pickers) */}
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
              </div>

              {/* Modal Buttons */}
              <div className="admin-offer-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
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
          <div
            className="admin-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">Delete Offer</h2>
            <p className="admin-confirm-modal-msg">
              Are you sure you want to delete{" "}
              <strong>"{deleteConfirmModal.offer?.name}"</strong>? This action
              cannot be undone.
            </p>
            <div className="admin-confirm-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setDeleteConfirmModal({ isOpen: false, offer: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-danger"
                onClick={handleDeleteOffer}
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
          onClick={() => setStatusConfirmModal({ isOpen: false, offer: null })}
        >
          <div
            className="admin-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">
              {statusConfirmModal.offer?.isActive
                ? "Deactivate Offer"
                : "Activate Offer"}
            </h2>
            <p className="admin-confirm-modal-msg">
              {statusConfirmModal.offer?.isActive ? (
                <>
                  Are you sure you want to deactivate offer{" "}
                  <strong>"{statusConfirmModal.offer?.name}"</strong>? This
                  discount will immediately stop applying to eligible items in
                  the store.
                </>
              ) : (
                <>
                  Are you sure you want to activate offer{" "}
                  <strong>"{statusConfirmModal.offer?.name}"</strong>? This
                  discount will start applying to eligible items in the store.
                </>
              )}
            </p>
            <div className="admin-confirm-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setStatusConfirmModal({ isOpen: false, offer: null })
                }
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  statusConfirmModal.offer?.isActive
                    ? "admin-btn-danger"
                    : "admin-btn-primary"
                }
                onClick={async () => {
                  const targetOffer = statusConfirmModal.offer;
                  setStatusConfirmModal({ isOpen: false, offer: null });
                  if (targetOffer) {
                    await handleToggleStatus(targetOffer._id);
                  }
                }}
                disabled={actionLoadingId !== null}
              >
                {statusConfirmModal.offer?.isActive
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

export default AdminOffersPage;
