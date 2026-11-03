import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getOrderByIdApi,
  cancelOrderApi,
  requestReturnApi,
  cancelOrderItemApi,
  requestOrderItemReturnApi,
} from "../../api/shopApi";

const ORDER_STEPS = [
  { key: "Pending", label: "Placed" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Shipped", label: "Shipped" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
];

export const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeItemTarget, setActiveItemTarget] = useState(null);

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await getOrderByIdApi(orderId);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Unable to retrieve order details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Compute active step index for the tracker
  const getStepIndex = (status) => {
    switch (status) {
      case "Pending":
        return 0;
      case "Confirmed":
        return 1;
      case "Shipped":
        return 2;
      case "Out for Delivery":
        return 3;
      case "Delivered":
        return 4;
      default:
        return -1;
    }
  };

  // 1. Cancel Order Action
  const handleConfirmCancel = async () => {
    try {
      setIsSubmitting(true);
      let res;

      if (activeItemTarget) {
        res = await cancelOrderItemApi(order.orderId, activeItemTarget._id, {
          reason: cancelReason,
        });
      } else {
        res = await cancelOrderApi(order.orderId, { reason: cancelReason });
      }

      if (res.data.success) {
        setActionSuccess(
          activeItemTarget
            ? `Item "${activeItemTarget.title}" has been cancelled.`
            : "Your order has been cancelled successfully.",
        );
        setIsCancelModalOpen(false);
        setActiveItemTarget(null);
        setCancelReason("");
        await fetchOrderDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Request Return Action
  const handleConfirmReturn = async () => {
    if (!returnReason.trim()) {
      alert("Please provide a reason for the return request.");
      return;
    }
    try {
      setIsSubmitting(true);

      let res;

      if (activeItemTarget) {
        res = await requestOrderItemReturnApi(
          order.orderId,
          activeItemTarget._id,
          { reason: returnReason },
        );
      } else {
        res = await requestReturnApi(order.orderId, {
          reason: returnReason,
        });
      }

      if (res.data.success) {
        setActionSuccess(
          activeItemTarget
            ? `Return request submitted for "${activeItemTarget.title}".`
            : "Return request submitted for entire order.",
        );
        setIsReturnModalOpen(false);
        setActiveItemTarget(null);
        setReturnReason("");
        await fetchOrderDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit return request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading-state" style={{ padding: "6rem 0" }}>
        <div className="cart-spinner-small"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="empty-cart-view" style={{ padding: "6rem 1.5rem" }}>
        <h2>Order Not Found</h2>
        <p>{errorMessage || "We could not find the requested order."}</p>
        <Link to="/orders" className="btn btn-primary">
          Back to Orders &rarr;
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === "Cancelled";
  const isPaymentFailed = order.paymentStatus === "Failed";
  const isOnlinePayment = order.paymentMethod === "RAZORPAY";
  const isPaymentSuccessful =
    order.paymentStatus === "Paid" ||
    order.paymentStatus === "Partially Refunded";

  const hasActiveItems = order.items.some(
    (item) => item.status !== "Cancelled",
  );

  const hasReturnRequest =
    order.returnRequest &&
    order.returnRequest.status &&
    order.returnRequest.status !== "None";

  const canCancel =
    ["Pending", "Confirmed"].includes(order.orderStatus) &&
    (!isOnlinePayment || isPaymentSuccessful) &&
    hasActiveItems;
    
  const canReturn = order.orderStatus === "Delivered" && !hasReturnRequest;

  const orderSteps = isPaymentFailed
    ? [
        { key: "Failed", label: "Failed" },
        { key: "Confirmed", label: "Confirmed" },
        { key: "Shipped", label: "Shipped" },
        { key: "Out for Delivery", label: "Out for Delivery" },
        { key: "Delivered", label: "Delivered" },
      ]
    : ORDER_STEPS;

  return (
    <div className="order-success-page" style={{ maxWidth: "1020px" }}>
      {/* Printable Invoice Header (Appears ONLY in Print / PDF export) */}
      <div className="invoice-print-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "serif",
                fontSize: "1.8rem",
                letterSpacing: "0.08em",
                margin: "0 0 4px",
              }}
            >
              ALTIER
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
              Tax Invoice / Order Receipt
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.82rem", color: "#777" }}>
              Order Reference
            </div>
            <strong style={{ fontFamily: "monospace", fontSize: "1.05rem" }}>
              {order.orderId}
            </strong>
            <div
              style={{ fontSize: "0.8rem", color: "#666", marginTop: "3px" }}
            >
              Date:{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Breadcrumb & Actions Bar */}
      <div
        className="order-details-top-bar no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <Link
          to="/orders"
          style={{
            color: "#666",
            textDecoration: "none",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          &larr; Back to Order History
        </Link>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
          >
            🖨 Print Invoice
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          className="no-print"
          style={{
            background: "#ecfdf5",
            color: "#065f46",
            padding: "0.85rem 1.25rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
            border: "1px solid #a7f3d0",
            fontSize: "0.88rem",
          }}
        >
          ✓ {actionSuccess}
        </div>
      )}

      {/* Order Title Header */}
      <div style={{ marginBottom: "2rem" }}>
        <span className="editorial-eyebrow">ORDER DETAILS</span>
        <h1 className="editorial-title" style={{ fontSize: "1.85rem" }}>
          Order {order.orderId}
        </h1>
        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.2rem" }}>
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {order.paymentStatus === "Failed" &&
        order.orderStatus !== "Cancelled" && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "1.25rem 1.5rem",
              borderRadius: "6px",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "1.2rem", color: "#dc2626" }}>⚠️</span>
                <strong style={{ color: "#991b1b" }}>Payment Incomplete</strong>
              </div>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                }}
              >
                Your payment could not be processed. Please retry payment to
                confirm your order.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/orders/failure/${order.orderId}`, {
                  replace: true,
                  state: {
                    reason:
                      "Payment pending or failed. You can complete it now.",
                  },
                })
              }
              className="btn btn-primary"
              style={{
                padding: "0.6rem 1.4rem",
                fontSize: "0.85rem",
                background: "#dc2626",
                borderColor: "#dc2626",
              }}
            >
              Retry Payment Now ↻
            </button>
          </div>
        )}

      {/* Fulfillment Status Banner / Tracker */}
      {isCancelled ? (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "1.25rem 1.5rem",
            borderRadius: "6px",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>✕</span>
            <strong style={{ color: "#991b1b" }}>
              This order has been cancelled
            </strong>
          </div>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#b91c1c",
              fontSize: "0.85rem",
            }}
          >
            Reason: {order.cancellation?.reason || "Cancelled by customer"}
          </p>
        </div>
      ) : (
        <div
          className="order-stepper-box no-print"
          style={{ marginBottom: "2rem" }}
        >
          <div className="stepper-title">Fulfillment Progress</div>
          <div className="stepper-track">
            {orderSteps.map((step, idx) => {
              const isFailedStep = isPaymentFailed && idx === 0;
              const isDone = !isPaymentFailed && currentStep >= idx;

              return (
                <div
                  key={step.key}
                  className={`stepper-step ${isDone ? "step-done" : ""}`}
                >
                  <div
                    className="step-circle"
                    style={
                      isFailedStep
                        ? {
                            backgroundColor: "#dc2626",
                            color: "#ffffff",
                            borderColor: "#dc2626",
                          }
                        : undefined
                    }
                  >
                    {" "}
                    {isFailedStep ? "✕" : isDone ? "✓" : idx + 1}
                  </div>
                  <span
                    className="step-label"
                    style={
                      isFailedStep
                        ? { color: "#dc2626", fontWeight: 700 }
                        : undefined
                    }
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return Request Status Banner */}
      {hasReturnRequest && (
        <div
          style={{
            background:
              order.returnRequest.status === "Approved"
                ? "#ecfdf5"
                : order.returnRequest.status === "Rejected"
                  ? "#fef2f2"
                  : "#fffbeb",
            border: "1px solid",
            borderColor:
              order.returnRequest.status === "Approved"
                ? "#a7f3d0"
                : order.returnRequest.status === "Rejected"
                  ? "#fecaca"
                  : "#fde68a",
            padding: "1rem 1.25rem",
            borderRadius: "6px",
            marginBottom: "2rem",
            fontSize: "0.88rem",
          }}
        >
          <strong>
            Return Status: {order.returnRequest.status.toUpperCase()}
          </strong>
          <p style={{ margin: "0.25rem 0 0" }}>
            Reason provided: "{order.returnRequest.reason}"
          </p>
          {order.returnRequest.adminNote && (
            <p style={{ margin: "0.25rem 0 0", fontStyle: "italic" }}>
              Admin Note: "{order.returnRequest.adminNote}"
            </p>
          )}
        </div>
      )}

      {/* Main Grid: Left = Items, Right = Address & Totals */}
      <div className="order-details-grid">
        {/* Left Column: Items */}
        <div className="order-items-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              Purchased Items ({order.items.length})
            </h3>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {order.items.map((item) => {
              const isItemCancelled = item.status === "Cancelled";
              const isItemReturned = item.status === "Returned";
              const isItemReturnRequested =
                item.status === "Return Requested" ||
                item.returnRequest?.status === "Pending";

              const canCancelItem = canCancel && !isItemCancelled;

              const canReturnItem =
                order.orderStatus === "Delivered" &&
                !isItemCancelled &&
                !isItemReturned &&
                !isItemReturnRequested;

              return (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #fafafa",
                    opacity: isItemCancelled ? 0.65 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "60px",
                        height: "75px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #eee",
                      }}
                    />
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.95rem",
                          fontWeight: 600,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          margin: "0.2rem 0",
                          color: "#666",
                          fontSize: "0.82rem",
                        }}
                      >
                        {item.color} | Size: {item.size}
                      </p>
                      <span style={{ fontSize: "0.82rem", color: "#888" }}>
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                      </span>

                      {/* Item Status Badges */}
                      {isItemCancelled && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#dc2626",
                            background: "#fee2e2",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        >
                          Cancelled
                        </span>
                      )}
                      {isItemReturnRequested && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#b45309",
                            background: "#fef3c7",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        >
                          Return Requested
                        </span>
                      )}
                      {isItemReturned && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#6b21a8",
                            background: "#f3e8ff",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        >
                          Returned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Price and Action Button */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      ₹{item.itemTotal.toLocaleString()}
                    </div>

                    {/* Per-Item Cancel Button */}
                    {canCancelItem && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.25rem 0.6rem",
                          fontSize: "0.75rem",
                          color: "#dc2626",
                          borderColor: "#fca5a5",
                        }}
                        onClick={() => {
                          setActiveItemTarget(item);
                          setIsCancelModalOpen(true);
                        }}
                      >
                        Cancel Item
                      </button>
                    )}

                    {/* Per-Item Return Button */}
                    {canReturnItem && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.25rem 0.6rem",
                          fontSize: "0.75rem",
                          color: "#b45309",
                          borderColor: "#fcd34d",
                        }}
                        onClick={() => {
                          setActiveItemTarget(item);
                          setIsReturnModalOpen(true);
                        }}
                      >
                        Return Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons: Cancel or Return */}
          <div
            className="order-actions-row no-print"
            style={{
              marginTop: "1.5rem",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {canCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                onClick={() => {
                  setActiveItemTarget(null);
                  setIsCancelModalOpen(true);
                }}
              >
                Cancel Entire Order
              </button>
            )}

            {canReturn && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: "#b45309", borderColor: "#fcd34d" }}
                onClick={() => {
                  setActiveItemTarget(null);
                  setIsReturnModalOpen(true);
                }}
              >
                Return Entire Order
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Address & Cost Breakdown */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Shipping Address Card */}
          <div className="order-meta-card">
            <h3 className="card-subheading">Shipping Address</h3>
            <p
              style={{
                margin: "0 0 0.25rem",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {order.shippingAddress?.fullName}
            </p>
            <p
              style={{
                margin: "0 0 0.5rem",
                color: "#666",
                fontSize: "0.85rem",
              }}
            >
              Phone: {order.shippingAddress?.phone}
            </p>
            <p
              style={{
                margin: 0,
                color: "#444",
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              {order.shippingAddress?.streetAddress}
              {order.shippingAddress?.apartment
                ? `, ${order.shippingAddress.apartment}`
                : ""}
              , {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
              {order.shippingAddress?.postalCode}
            </p>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="order-meta-card">
            <h3 className="card-subheading">Payment & Summary</h3>
            <div className="order-cost-breakdown">
              <div className="cost-row">
                <span>Subtotal</span>
                <span>₹{order.pricing.subtotal.toLocaleString()}</span>
              </div>
              <div className="cost-row">
                <span>Shipping</span>
                <span>
                  {order.pricing.shippingFee === 0
                    ? "FREE"
                    : `₹${order.pricing.shippingFee}`}
                </span>
              </div>
              <div
                className="cost-row total-row"
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <span>Total Amount</span>
                <span>₹{order.pricing.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid #f0f0f0",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem",
                }}
              >
                <span style={{ color: "#666" }}>Method:</span>
                <strong>
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : order.paymentMethod === "WALLET"
                      ? "Wallet"
                      : "Online (Razorpay)"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Status:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      order.paymentStatus === "Paid"
                        ? "#059669"
                        : order.paymentStatus === "Refunded"
                          ? "#7c3aed"
                          : "#d97706",
                  }}
                >
                  ● {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card" style={{ maxWidth: "450px" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>
              {activeItemTarget
                ? `Cancel Item: ${activeItemTarget.title}`
                : "Cancel Order"}
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              {activeItemTarget
                ? `Are you sure you want to cancel ${activeItemTarget.title} (${activeItemTarget.size})?`
                : `Are you sure you want to cancel order ${order.orderId}?`}
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "0.3rem",
                }}
              >
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind / Ordered wrong size"
                className="admin-order-input"
                style={{ minHeight: "75px" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setActiveItemTarget(null);
                  setCancelReason("");
                }}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
              >
                {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Return Request Modal */}
      {isReturnModalOpen && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card" style={{ maxWidth: "450px" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>
              {activeItemTarget
                ? `Request Return: ${activeItemTarget.title}`
                : "Request Return"}
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              {activeItemTarget
                ? `Please let us know why you wish to return ${activeItemTarget.title} (${activeItemTarget.size}).`
                : `Order ${order.orderId} was delivered. Please let us know why you wish to return your purchase.`}
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "0.3rem",
                }}
              >
                Reason for Return (Required):
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Size does not fit, defective item, etc."
                className="admin-order-input"
                style={{ minHeight: "85px" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setActiveItemTarget(null);
                  setReturnReason("");
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#b45309", borderColor: "#b45309" }}
                disabled={isSubmitting}
                onClick={handleConfirmReturn}
              >
                {isSubmitting ? "Submitting..." : "Submit Return Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
