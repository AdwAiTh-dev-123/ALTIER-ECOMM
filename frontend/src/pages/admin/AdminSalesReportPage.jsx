import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminSalesReport,
  downloadAdminSalesReport,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/admin.css";

const PRESET_RANGES = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "This Year", value: "year" },
  { label: "Custom Range", value: "custom" },
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

      // Create browser blob download link
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
      alert("Failed to export sales report. Please try again.");
    } finally {
      if (isPdf) setIsExportingPdf(false);
      else setIsExportingExcel(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div
        className="admin-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="admin-page-title">Sales Analytics & Report</h1>
          <p className="admin-page-subtitle">
            Inspect total revenue, volume trends, and export verified sales
            reports.
          </p>
        </div>

        {/* Download Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => handleDownload("excel")}
            disabled={isExportingExcel || isLoading || orders.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
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
            className="admin-btn-primary"
            onClick={() => handleDownload("pdf")}
            disabled={isExportingPdf || isLoading || orders.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
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
        <div className="admin-stat-card stat-success">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Revenue</span>
            <span className="admin-stat-icon-wrap">💰</span>
          </div>
          <div className="admin-stat-value">
            ₹{Number(summary.totalSalesAmount || 0).toLocaleString("en-IN")}
          </div>
          <span className="admin-stat-note">
            Gross sales in selected period
          </span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Completed Orders</span>
            <span className="admin-stat-icon-wrap">📦</span>
          </div>
          <div className="admin-stat-value">{summary.totalOrders}</div>
          <span className="admin-stat-note">Successful fulfillment count</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Units Sold</span>
            <span className="admin-stat-icon-wrap">🏷️</span>
          </div>
          <div className="admin-stat-value">{summary.totalItemsSold}</div>
          <span className="admin-stat-note">
            Total apparel pieces dispatched
          </span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Average Order Value</span>
            <span className="admin-stat-icon-wrap">📈</span>
          </div>
          <div className="admin-stat-value">
            ₹{Number(summary.averageOrderValue || 0).toLocaleString("en-IN")}
          </div>
          <span className="admin-stat-note">Average cart spend per order</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="admin-panel-card"
        style={{
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Preset Range Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div className="admin-filter-tabs">
            {PRESET_RANGES.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`admin-filter-tab ${dateRange === preset.value ? "active" : ""}`}
                onClick={() => {
                  setDateRange(preset.value);
                  setCurrentPage(1);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Status & Payment Method */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Status: Valid Orders</option>
              <option value="Delivered">Status: Delivered Only</option>
              <option value="Shipped">Status: Shipped</option>
              <option value="Confirmed">Status: Confirmed</option>
              <option value="Pending">Status: Pending</option>
            </select>

            <select
              className="admin-select"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Payment: All Methods</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === "custom" && (
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
              paddingTop: "0.5rem",
              borderTop: "1px solid #f5f4f0",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#44403c",
                }}
              >
                Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-search-input"
                style={{ padding: "0.4rem 0.75rem", width: "auto" }}
              />
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#44403c",
                }}
              >
                End Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-search-input"
                style={{ padding: "0.4rem 0.75rem", width: "auto" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table Panel */}
      <div className="admin-panel-card">
        <div className="admin-table-responsive">
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
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "2.5rem 1rem",
                      color: "#78716c",
                    }}
                  >
                    Loading sales records...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "2.5rem 1rem",
                      color: "#78716c",
                    }}
                  >
                    No orders match the selected date range and filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong
                        style={{ fontFamily: "monospace", color: "#1c1917" }}
                      >
                        {order.orderId}
                      </strong>
                    </td>
                    <td className="admin-date-text">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1c1917" }}>
                        {order.shippingAddress?.fullName ||
                          order.user?.name ||
                          "Customer"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#78716c" }}>
                        {order.user?.email || order.shippingAddress?.phone}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          color: "#44403c",
                        }}
                      >
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td style={{ color: "#44403c" }}>
                      {order.items?.length || 0}{" "}
                      {order.items?.length === 1 ? "item" : "items"}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          order.orderStatus === "Delivered"
                            ? "status-active"
                            : "status-blocked"
                        }`}
                        style={{
                          backgroundColor:
                            order.orderStatus === "Delivered"
                              ? "#ecfdf5"
                              : "#eff6ff",
                          color:
                            order.orderStatus === "Delivered"
                              ? "#065f46"
                              : "#1e40af",
                        }}
                      >
                        ● {order.orderStatus}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#1c1917",
                      }}
                    >
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
