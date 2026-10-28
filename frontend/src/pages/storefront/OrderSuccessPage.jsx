import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { getOrderByIdApi } from "../../api/shopApi";

export const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order && orderId) {
      const fetchOrder = async () => {
        try {
          setIsLoading(true);
          const res = await getOrderByIdApi(orderId);
          if (res.data.success) {
            setOrder(res.data.order);
          }
        } catch (err) {
          setError("Unable to load order details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId, order]);

  if (isLoading) {
    return (
      <div className="profile-loading-state" style={{ padding: "6rem 0" }}>
        <div className="cart-spinner-small"></div>
        <p>Retrieving your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="empty-cart-view" style={{ padding: "6rem 1.5rem" }}>
        <h2>Order Not Found</h2>
        <p>{error || "We could not locate this order record."}</p>
        <Link to="/collections" className="btn btn-primary">
          Continue Shopping &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      {/* Confirmation Header */}
      <div className="order-success-card">
        <div className="success-icon-badge">✓</div>
        <span className="editorial-eyebrow">ORDER CONFIRMED</span>
        <h1 className="success-heading">Thank you for your purchase</h1>
        <p className="success-subheading">
          Your order has been received and is being prepared for dispatch.
        </p>
        <div className="order-id-pill">
          Order Reference: <strong>{order.orderId}</strong>
        </div>
      </div>

      <div className="order-details-grid">
        {/* Left: Items Summary */}
        <div className="order-receipt-card">
          <h3 className="card-heading">Purchased Items</h3>
          <div className="receipt-items-list">
            {order.items.map((item) => (
              <div key={item._id} className="receipt-item-row">
                <img
                  src={item.image}
                  alt={item.title}
                  className="receipt-thumb"
                />
                <div className="receipt-item-details">
                  <h4>{item.title}</h4>
                  <p>
                    {item.color} | Size: {item.size}
                  </p>
                  <span>Qty: {item.quantity}</span>
                </div>
                <div className="receipt-item-price">
                  ₹{item.itemTotal.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-totals-box">
            <div className="receipt-row">
              <span>Subtotal</span>
              <span>₹{order.pricing.subtotal.toLocaleString()}</span>
            </div>
            <div className="receipt-row">
              <span>Delivery Fee</span>
              <span>
                {order.pricing.shippingFee === 0
                  ? "FREE"
                  : `₹${order.pricing.shippingFee}`}
              </span>
            </div>
            <div className="receipt-row total-row">
              <span>Total Paid / Payable</span>
              <span>₹{order.pricing.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Delivery & Payment Details */}
        <div className="order-meta-card">
          <div className="meta-block">
            <h3 className="card-heading">Delivery Address</h3>
            <p className="meta-text-bold">{order.shippingAddress.fullName}</p>
            <p className="meta-text">{order.shippingAddress.streetAddress}</p>
            {order.shippingAddress.apartment && (
              <p className="meta-text">{order.shippingAddress.apartment}</p>
            )}
            <p className="meta-text">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="meta-text" style={{ marginTop: "0.5rem" }}>
              Phone: +91 {order.shippingAddress.phone}
            </p>
          </div>

          <div className="meta-block" style={{ marginTop: "1.5rem" }}>
            <h3 className="card-heading">Payment Information</h3>
            <p className="meta-text">
              Method:{" "}
              <strong>
                {order.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : "Online Payment"}
              </strong>
            </p>
            <p className="meta-text">
              Payment Status:{" "}
              <span
                className={`status-pill ${order.paymentStatus.toLowerCase()}`}
              >
                {order.paymentStatus}
              </span>
            </p>
          </div>

          <div className="order-action-links">
            <Link to="/collections" className="btn btn-primary btn-block">
              Continue Exploring Collections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
