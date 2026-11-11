import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminSalesReport,
  downloadAdminSalesReport,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminSalesReportPage.css";

const PRESET_RANGES = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "This Year", value: "year" },
  { label: "Custom Range", value: "custom" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "Valid Orders (Active)", value: "all" },
  { label: "Delivered Only", value: "Delivered" },
  { label: "Shipped", value: "Shipped" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Pending", value: "Pending" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Returned", value: "Returned" },
];

const PAYMENT_METHOD_OPTIONS = [
  { label: "All Methods", value: "all" },
  { label: "Razorpay", value: "RAZORPAY" },
  { label: "Cash on Delivery (COD)", value: "COD" },
  { label: "Wallet", value: "WALLET" },
];

const AdminSalesReportPage = () => {
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSalesAmount: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // In-DOM Dropdowns
  const [openRangeDropdown, setOpenRangeDropdown] = useState(false);
  const rangeDropdownRef = useRef(null);

  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  const [openPaymentDropdown, setOpenPaymentDropdown] = useState(false);
  const paymentDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        rangeDropdownRef.current &&
        !rangeDropdownRef.current.contains(event.target)
      ) {
        setOpenRangeDropdown(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setOpenStatusDropdown(false);
      }
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target)
      ) {
        setOpenPaymentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch report data
  const loadSalesReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminSalesReport({
        dateRange,
        startDate: dateRange === "custom" ? startDate : undefined,
        endDate: dateRange === "custom" ? endDate : undefined,
        status: statusFilter,
        paymentMethod,
        page: currentPage,
        limit: 10,
      });

      if (res.data?.success) {
        setOrders(res.data.orders || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load sales report",
      );
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, startDate, endDate, statusFilter, paymentMethod, currentPage]);

  useEffect(() => {
    loadSalesReport();
  }, [loadSalesReport]);

  // Handle File Downloads
  const handleDownload = async (format) => {
    const isPdf = format === "pdf";
    if (isPdf) setIsExportingPdf(true);
    else setIsExportingExcel(true);

    try {
      const res = await downloadAdminSalesReport({
        dateRange,
        startDate: dateRange === "custom" ? startDate : undefined,
        endDate: dateRange === "custom" ? endDate : undefined,
        status: statusFilter,
        paymentMethod,
        format,
      });

      const blob = new Blob([res.data], {
        type: isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        `sales-report-${dateRange}-${Date.now()}.${isPdf ? "pdf" : "xlsx"}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to export sales report:", err);
      setErrorMessage("Failed to export sales report. Please try again.");
    } finally {
      if (isPdf) setIsExportingPdf(false);
      else setIsExportingExcel(false);
    }
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setDateRange("month");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setPaymentMethod("all");
    setCurrentPage(1);
  };

  // Helper Labels
  const currentRangeLabel =
    PRESET_RANGES.find((p) => p.value === dateRange)?.label || "Last 30 Days";
  const currentStatusLabel =
    STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter)?.label ||
    "Valid Orders";
  const currentPaymentLabel =
    PAYMENT_METHOD_OPTIONS.find((m) => m.value === paymentMethod)?.label ||
    "All Methods";

  // Semantic Status Badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Delivered":
        return "status-delivered";
      case "Shipped":
        return "status-shipped";
      case "Confirmed":
        return "status-confirmed";
      case "Pending":
        return "status-pending";
      case "Cancelled":
        return "status-cancelled";
      case "Returned":
        return "status-returned";
      default:
        return "status-confirmed";
    }
  };

  const hasActiveFilters =
    dateRange !== "month" ||
    statusFilter !== "all" ||
    paymentMethod !== "all" ||
    startDate ||
    endDate;

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-titles">
          <h1 className="admin-page-title">Sales Analytics & Reports</h1>
          <p className="admin-page-subtitle">
            Inspect total revenue, volume trends, and export verified sales
            audits in Excel or PDF format.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-export-excel"
            onClick={() => handleDownload("excel")}
            disabled={isExportingExcel || isLoading || orders.length === 0}
            aria-label="Export Sales Report as Excel"
          >
            <span>📊</span>
            <span>
              {isExportingExcel
                ? "Generating Excel..."
                : "Export Excel (.xlsx)"}
            </span>
          </button>

          <button
            type="button"
            className="admin-btn-export-pdf"
            onClick={() => handleDownload("pdf")}
            disabled={isExportingPdf || isLoading || orders.length === 0}
            aria-label="Export Sales Report as PDF"
          >
            <span>📄</span>
            <span>{isExportingPdf ? "Generating PDF..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-alert-banner alert-danger">⚠️ {errorMessage}</div>
      )}

      {/* Metric Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card stat-revenue">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Revenue</span>
            <span className="admin-stat-icon-wrap">💰</span>
          </div>
          <div className="admin-stat-value">
            ₹{Number(summary.totalSalesAmount || 0).toLocaleString("en-IN")}
          </div>
          <span className="admin-stat-note">Gross sales in selected range</span>
        </div>

        <div className="admin-stat-card stat-orders">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Completed Orders</span>
            <span className="admin-stat-icon-wrap">📦</span>
          </div>
          <div className="admin-stat-value">{summary.totalOrders}</div>
          <span className="admin-stat-note">Successful fulfillment count</span>
        </div>

        <div className="admin-stat-card stat-units">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Units Sold</span>
            <span className="admin-stat-icon-wrap">🏷️</span>
          </div>
          <div className="admin-stat-value">{summary.totalItemsSold}</div>
          <span className="admin-stat-note">Total pieces dispatched</span>
        </div>

        <div className="admin-stat-card stat-aov">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Average Order Value</span>
            <span className="admin-stat-icon-wrap">📈</span>
          </div>
          <div className="admin-stat-value">
            ₹{Number(summary.averageOrderValue || 0).toLocaleString("en-IN")}
          </div>
          <span className="admin-stat-note">Average spend per customer order</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="admin-sales-controls-card">
        <div className="admin-sales-controls-row">
          {/* Preset Range Tabs (Desktop Only) */}
          <div className="admin-sales-tabs-desktop">
            {PRESET_RANGES.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`admin-sales-tab-btn ${dateRange === preset.value ? "active" : ""}`}
                onClick={() => {
                  setDateRange(preset.value);
                  setCurrentPage(1);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Preset Range In-DOM Dropdown (Mobile Only) */}
          <div
            className="admin-sales-dropdown-wrap admin-sales-range-mobile-wrap"
            ref={rangeDropdownRef}
          >
            <button
              type="button"
              className="admin-sales-dropdown-btn"
              onClick={() => setOpenRangeDropdown((prev) => !prev)}
              aria-expanded={openRangeDropdown}
            >
              <span className="admin-sales-dropdown-btn-text">
                Range: <strong>{currentRangeLabel}</strong>
              </span>
              <span
                className={`admin-sales-dropdown-chevron ${openRangeDropdown ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {openRangeDropdown && (
              <div className="admin-sales-dropdown-menu">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`admin-sales-dropdown-item ${dateRange === preset.value ? "selected" : ""}`}
                    onClick={() => {
                      setDateRange(preset.value);
                      setCurrentPage(1);
                      setOpenRangeDropdown(false);
                    }}
                  >
                    <span>{preset.label}</span>
                    {dateRange === preset.value && (
                      <span className="admin-sales-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Filters: Status & Payment Method */}
          <div className="admin-sales-filters-group">
            {/* Status In-DOM Dropdown */}
            <div className="admin-sales-dropdown-wrap" ref={statusDropdownRef}>
              <button
                type="button"
                className="admin-sales-dropdown-btn"
                onClick={() => setOpenStatusDropdown((prev) => !prev)}
                aria-expanded={openStatusDropdown}
              >
                <span className="admin-sales-dropdown-btn-text">
                  Status: <strong>{currentStatusLabel}</strong>
                </span>
                <span
                  className={`admin-sales-dropdown-chevron ${openStatusDropdown ? "open" : ""}`}
                >
                  ▼
                </span>
              </button>

              {openStatusDropdown && (
                <div className="admin-sales-dropdown-menu">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`admin-sales-dropdown-item ${statusFilter === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setCurrentPage(1);
                        setOpenStatusDropdown(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.value && (
                        <span className="admin-sales-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method In-DOM Dropdown */}
            <div className="admin-sales-dropdown-wrap" ref={paymentDropdownRef}>
              <button
                type="button"
                className="admin-sales-dropdown-btn"
                onClick={() => setOpenPaymentDropdown((prev) => !prev)}
                aria-expanded={openPaymentDropdown}
              >
                <span className="admin-sales-dropdown-btn-text">
                  Payment: <strong>{currentPaymentLabel}</strong>
                </span>
                <span
                  className={`admin-sales-dropdown-chevron ${openPaymentDropdown ? "open" : ""}`}
                >
                  ▼
                </span>
              </button>

              {openPaymentDropdown && (
                <div className="admin-sales-dropdown-menu">
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`admin-sales-dropdown-item ${paymentMethod === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setPaymentMethod(opt.value);
                        setCurrentPage(1);
                        setOpenPaymentDropdown(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {paymentMethod === opt.value && (
                        <span className="admin-sales-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="admin-btn-clear-sales-filters"
                onClick={handleResetFilters}
              >
                <span>Clear Filters ✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === "custom" && (
          <div className="admin-sales-custom-dates-bar">
            <div className="admin-sales-date-field">
              <label htmlFor="sales-start-date" className="admin-sales-date-label">
                Start Date:
              </label>
              <input
                id="sales-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-sales-date-input"
              />
            </div>

            <div className="admin-sales-date-field">
              <label htmlFor="sales-end-date" className="admin-sales-date-label">
                End Date:
              </label>
              <input
                id="sales-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-sales-date-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table Panel */}
      <div className="admin-sales-table-card">
        <div className="admin-sales-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state-cell">
                    Loading sales records...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state-cell">
                    <div className="admin-empty-state-content">
                      <div className="admin-empty-icon">📊</div>
                      <h3 className="admin-empty-title">
                        No sales records found
                      </h3>
                      <p className="admin-empty-desc">
                        No orders match the selected date range and filter
                        parameters. Try widening your date selection or clearing
                        filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="admin-empty-reset-btn"
                          onClick={handleResetFilters}
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="admin-order-id-code">
                        {order.orderId}
                      </span>
                    </td>
                    <td className="admin-date-text">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="admin-customer-cell">
                        <span className="admin-customer-name">
                          {order.shippingAddress?.fullName ||
                            order.user?.name ||
                            "Customer"}
                        </span>
                        <span className="admin-customer-sub">
                          {order.user?.email || order.shippingAddress?.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-payment-pill">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="admin-items-count">
                        {order.items?.length || 0}{" "}
                        {order.items?.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${getStatusBadgeClass(order.orderStatus)}`}
                      >
                        <span className="status-dot"></span>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="admin-amount-cell">
                      ₹
                      {(order.pricing?.totalAmount || 0).toLocaleString(
                        "en-IN",
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalOrders}
          limit={pagination.limit}
          onPageChange={(page) => setCurrentPage(page)}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default AdminSalesReportPage;
