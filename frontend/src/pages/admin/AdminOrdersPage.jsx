import { useState, useEffect, useCallback } from "react";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  reviewAdminReturnRequest,
} from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminProductsPage.css";
import "../../styles/admins/AdminOrdersPage.css";

const STATUS_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
  "Return Requested": [],
  Returned: [],
};

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [modalError, setModalError] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });

  //debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Action Modals
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    order: null,
    nextStatus: "",
    comment: "",
  });

  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    order: null,
    action: "APPROVE",
    adminNote: "",
  });

  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    order: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3500);
  };

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminOrders({
        search,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusModal.order || !statusModal.nextStatus) return;
    setModalError("");
    try {
      setIsSubmitting(true);
      const targetId = statusModal.order._id || statusModal.order.orderId;
      const res = await updateAdminOrderStatus(targetId, {
        status: statusModal.nextStatus,
        newStatus: statusModal.nextStatus,
        comment: statusModal.comment,
      });

      if (res.data.success) {
        showToast(`Order status updated to "${statusModal.nextStatus}".`);
        setStatusModal({
          isOpen: false,
          order: null,
          nextStatus: "",
          comment: "",
        });
        loadOrders();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update order status";
      setModalError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Return Review
  const handleConfirmReturnReview = async () => {
    if (!returnModal.order) return;
    setModalError("");
    try {
      setIsSubmitting(true);
      const targetId = returnModal.order._id || returnModal.order.orderId;
      const res = await reviewAdminReturnRequest(targetId, {
        decision: returnModal.action === "APPROVE" ? "APPROVE" : "REJECTED",
        action: returnModal.action,
        adminNote: returnModal.adminNote,
      });

      if (res.data.success) {
        showToast(
          `Return request ${returnModal.action === "APPROVE" ? "Approved" : "Rejected"}.`,
        );
        setReturnModal({
          isOpen: false,
          order: null,
          action: "APPROVE",
          adminNote: "",
        });
        loadOrders();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to process return review";
      setModalError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Delivered":
        return { background: "#ecfdf5", color: "#065f46" };
      case "Cancelled":
        return { background: "#fef2f2", color: "#991b1b" };
      case "Return Requested":
        return { background: "#fffbeb", color: "#b45309" };
      case "Returned":
        return { background: "#f3e8ff", color: "#6b21a8" };
      default:
        return { background: "#eff6ff", color: "#1e40af" };
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Orders & Inventory</h1>
          <p className="admin-subtitle">
            Manage customer fulfillment, update tracking statuses, and process
            returns.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="admin-orders-toast-success">✓ {successToast}</div>
      )}

      {errorMessage && (
        <div className="admin-orders-toast-error">⚠️ {errorMessage}</div>
      )}

      {/* Search & Filters */}
      <div className="admin-controls-card admin-order-modal-field">
        <div className="admin-orders-controls-row">
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-orders-search-input"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-orders-select"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Return Requested">Return Requested</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        {isLoading && orders.length === 0 ? (
          <div className="admin-orders-empty-state">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-orders-empty-state">
            <p>No customer orders found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const allowedTransitions =
                  STATUS_TRANSITIONS[order.orderStatus] || [];
                const badgeClass = `admin-orders-badge badge-${order.orderStatus.toLowerCase().replace(/\s+/g, "-")}`;

                return (
                  <tr key={order._id}>
                    <td>
                      <strong className="admin-orders-code">
                        {order.orderId}
                      </strong>
                      <span className="admin-orders-date">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td>
                      <div className="admin-orders-customer-name">
                        {order.shippingAddress?.fullName || order.user?.name}
                      </div>
                      <div className="admin-orders-customer-phone">
                        {order.shippingAddress?.phone}
                      </div>
                    </td>

                    <td>
                      <span className="admin-orders-item-count">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>

                    <td>
                      <strong className="admin-orders-total">
                        ₹{order.pricing.totalAmount.toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      <div className="admin-orders-payment-method">
                        {order.paymentMethod}
                      </div>
                      <span
                        className={
                          order.paymentStatus === "Paid"
                            ? "admin-orders-payment-paid"
                            : "admin-orders-payment-pending"
                        }
                      >
                        ● {order.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <span className={badgeClass}>● {order.orderStatus}</span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="admin-order-actions-cell">
                        {/* Details View */}
                        <button
                          type="button"
                          className="admin-order-btn-view"
                          onClick={() =>
                            setDetailsModal({ isOpen: true, order })
                          }
                          title="View order details"
                        >
                          👁 View Details
                        </button>

                        {/* Status Change (If next statuses exist) */}
                        {allowedTransitions.length > 0 && (
                          <button
                            type="button"
                            className="admin-order-btn-status"
                            onClick={() => {
                              setModalError("");
                              setStatusModal({
                                isOpen: true,
                                order,
                                nextStatus: allowedTransitions[0],
                                comment: "",
                              });
                            }}
                            title="Update status"
                          >
                            Update Status ▾
                          </button>
                        )}

                        {/* Return Review Button */}
                        {order.orderStatus === "Return Requested" && (
                          <button
                            type="button"
                            className="admin-order-btn-return"
                            onClick={() =>
                              setReturnModal({
                                isOpen: true,
                                order,
                                action: "APPROVE",
                                adminNote: "",
                              })
                            }
                            title="Review return request"
                          >
                            Review Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalOrders}
          limit={pagination.limit}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* 1. Status Update Modal */}
      {statusModal.isOpen && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card">
            <div className="admin-order-modal-header">
              <h3 className="admin-order-modal-title">Update Order Status</h3>
              <button
                type="button"
                className="admin-order-modal-close"
                onClick={() => {
                  setModalError("");
                  setStatusModal({
                    isOpen: false,
                    order: null,
                    nextStatus: "",
                    comment: "",
                  });
                }}
              >
                ✕
              </button>
            </div>

            <p className="admin-order-modal-subtext">
              Order Reference:{" "}
              <strong className="admin-orders-code">
                {statusModal.order?.orderId}
              </strong>
            </p>

            {/* In-Modal Error Banner */}
            {modalError && (
              <div
                className="admin-order-modal-warning"
                style={{ marginBottom: "1rem" }}
              >
                ⚠️ {modalError}
              </div>
            )}

            <div className="admin-order-modal-field">
              <label className="admin-order-form-label">Next Status:</label>
              <select
                className="admin-order-select"
                value={statusModal.nextStatus}
                onChange={(e) =>
                  setStatusModal({ ...statusModal, nextStatus: e.target.value })
                }
              >
                {(STATUS_TRANSITIONS[statusModal.order?.orderStatus] || []).map(
                  (st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ),
                )}
              </select>
            </div>

            {statusModal.nextStatus === "Cancelled" && (
              <div className="admin-order-modal-warning">
                ⚠️ Cancelling this order will automatically restore the variant
                stock in inventory.
              </div>
            )}

            <div className="admin-order-modal-field">
              <label className="admin-order-form-label">
                Admin Comment (Optional):
              </label>
              <input
                type="text"
                className="admin-order-input"
                placeholder="e.g. Handed over to BlueDart courier"
                value={statusModal.comment}
                onChange={(e) =>
                  setStatusModal({ ...statusModal, comment: e.target.value })
                }
              />
            </div>

            <div className="admin-order-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setModalError("");
                  setStatusModal({
                    isOpen: false,
                    order: null,
                    nextStatus: "",
                    comment: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={isSubmitting}
                onClick={handleConfirmStatusChange}
              >
                {isSubmitting ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Return Review Modal */}
      {returnModal.isOpen && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card">
            <div className="admin-order-modal-header">
              <h3 className="admin-order-modal-title">
                Process Return Request
              </h3>
              <button
                type="button"
                className="admin-order-modal-close"
                onClick={() =>
                  setReturnModal({
                    isOpen: false,
                    order: null,
                    action: "APPROVE",
                    adminNote: "",
                  })
                }
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "0.75rem",
              }}
            >
              Order:{" "}
              <strong style={{ fontFamily: "monospace" }}>
                {returnModal.order?.orderId}
              </strong>
            </p>

            <div
              style={{
                background: "#fffbeb",
                padding: "0.85rem 1rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
                border: "1px solid #fde68a",
              }}
            >
              <strong
                style={{
                  color: "#92400e",
                  display: "block",
                  marginBottom: "0.2rem",
                }}
              >
                Customer's Reason:
              </strong>
              <p style={{ margin: 0, color: "#78350f" }}>
                "{returnModal.order?.returnRequest?.reason}"
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="admin-order-form-label">Decision:</label>
              <div
                style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={returnModal.action === "APPROVE"}
                    onChange={() =>
                      setReturnModal({ ...returnModal, action: "APPROVE" })
                    }
                  />
                  <span>Approve Return (Restores Stock)</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={returnModal.action === "REJECT"}
                    onChange={() =>
                      setReturnModal({ ...returnModal, action: "REJECT" })
                    }
                  />
                  <span>Reject Return</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="admin-order-form-label">
                Admin Note for Customer:
              </label>
              <textarea
                className="admin-order-input"
                placeholder="Reason for approval or rejection..."
                value={returnModal.adminNote}
                onChange={(e) =>
                  setReturnModal({ ...returnModal, adminNote: e.target.value })
                }
                style={{
                  minHeight: "75px",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="admin-order-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setReturnModal({
                    isOpen: false,
                    order: null,
                    action: "APPROVE",
                    adminNote: "",
                  })
                }
              >
                Close
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={isSubmitting}
                onClick={handleConfirmReturnReview}
              >
                {isSubmitting ? "Processing..." : "Submit Decision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Order Details Drawer Modal */}
      {detailsModal.isOpen && detailsModal.order && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card details-modal">
            <div className="admin-order-modal-header">
              <h3 className="admin-order-modal-title">
                Order Details: {detailsModal.order.orderId}
              </h3>
              <button
                type="button"
                className="admin-order-modal-close"
                onClick={() => setDetailsModal({ isOpen: false, order: null })}
              >
                ✕
              </button>
            </div>

            {/* Shipping Address */}
            <div className="admin-order-section-box">
              <h4 className="admin-order-section-title">Delivery Address</h4>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
                {detailsModal.order.shippingAddress?.fullName} |{" "}
                {detailsModal.order.shippingAddress?.phone}
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.85rem",
                  color: "#57534e",
                }}
              >
                {detailsModal.order.shippingAddress?.streetAddress},{" "}
                {detailsModal.order.shippingAddress?.city},{" "}
                {detailsModal.order.shippingAddress?.state} -{" "}
                {detailsModal.order.shippingAddress?.postalCode}
              </p>
            </div>

            {/* Items */}
            <h4
              className="admin-order-section-title"
              style={{ marginTop: "1rem" }}
            >
              Purchased Items
            </h4>
            <div className="admin-order-items-scroll">
              {detailsModal.order.items.map((item) => (
                <div key={item._id} className="admin-order-item-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "48px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #e7e5e4",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#78716c",
                          marginTop: "2px",
                        }}
                      >
                        {item.color} | Size: {item.size} | Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                    ₹{item.itemTotal.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Status Timeline */}
            <h4
              className="admin-order-section-title"
              style={{ marginTop: "1rem" }}
            >
              Status & Audit History
            </h4>
            <div className="admin-order-history-list">
              {detailsModal.order.statusHistory?.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <span>
                    ● <strong style={{ color: "#1c1917" }}>{h.status}</strong> -{" "}
                    {h.comment} ({h.updatedBy})
                  </span>
                  <span
                    style={{
                      color: "#78716c",
                      fontSize: "0.78rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(h.timestamp).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>

            <div className="admin-order-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setDetailsModal({ isOpen: false, order: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
