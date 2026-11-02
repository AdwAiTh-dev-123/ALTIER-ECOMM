import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserOrdersApi } from "../../api/shopApi";
import "../../styles/storefront/OrdersPage.css";

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await getUserOrdersApi(params);
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      setErrorMessage("Unable to load your orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Delivered":
        return "badge-status-delivered";
      case "Cancelled":
        return "badge-status-cancelled";
      case "Shipped":
      case "Out for Delivery":
        return "badge-status-shipped";
      case "Return Requested":
      case "Returned":
        return "badge-status-return";
      default:
        return "badge-status-pending";
    }
  };

  return (
    <div className="orders-page-root">
      {/* Header */}
      <div className="orders-page-header">
        <span className="editorial-eyebrow">YOUR ACCOUNT</span>
        <h1 className="editorial-title">Order History</h1>
        <p className="orders-page-subtitle">
          Track recent orders, view purchase receipts, and request returns.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="orders-filter-row orders-filter-card">
        {/* Status Filter Tabs */}
        <div className="orders-status-pills">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "ACTIVE", label: "Active" },
            { id: "FAILED", label: "Failed" },
            { id: "Delivered", label: "Delivered" },
            { id: "Cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`orders-status-btn ${statusFilter === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="orders-search-box"
        >
          <input
            type="text"
            placeholder="Search by Order ID or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="orders-search-input"
          />
          <button
            type="submit"
            className="btn btn-secondary"
          >
            Search
          </button>
        </form>
      </div>

      {errorMessage && (
        <div
          className="cart-inline-error-banner"
          style={{ marginBottom: "1.5rem" }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="profile-loading-state">
          <div className="cart-spinner-small"></div>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="order-receipt-card orders-empty-box">
          <div className="orders-empty-icon">📦</div>
          <h3 className="orders-empty-title">
            No orders found
          </h3>
          <p className="orders-empty-desc">
            {searchTerm || statusFilter !== "ALL"
              ? "No orders match your filter criteria."
              : "You haven't placed any orders yet."}
          </p>
          <Link
            to="/collections"
            className="btn btn-primary"
          >
            Explore Collections &rarr;
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="orders-list-stack">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            );

            return (
              <div
                key={order._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    padding: "1rem 1.5rem",
                    background: "#fbfaf8",
                    borderBottom: "1px solid #f0ede6",
                    fontSize: "0.85rem",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
                  >
                    <div>
                      <span style={{ color: "#777", display: "block" }}>
                        Order Placed
                      </span>
                      <strong>{formattedDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#777", display: "block" }}>
                        Total Amount
                      </span>
                      <strong>
                        ₹{order.pricing.totalAmount.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#777", display: "block" }}>
                        Order Reference
                      </span>
                      <strong style={{ fontFamily: "monospace" }}>
                        {order.orderId}
                      </strong>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Status Badge */}
                    <span
                      style={{
                        padding: "0.3rem 0.85rem",
                        borderRadius: "14px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background:
                          order.paymentStatus === "Failed"
                            ? "#fef2f2"
                            : order.orderStatus === "Delivered"
                              ? "#ecfdf5"
                              : order.orderStatus === "Cancelled"
                                ? "#fef2f2"
                                : "#eff6ff",
                        color:
                          order.paymentStatus === "Failed"
                            ? "#991b1b"
                            : order.orderStatus === "Delivered"
                              ? "#065f46"
                              : order.orderStatus === "Cancelled"
                                ? "#991b1b"
                                : "#1e40af",
                        border:
                          order.paymentStatus === "Failed"
                            ? "1px solid #fecaca"
                            : "none",
                      }}
                    >
                      ●{" "}
                      {order.paymentStatus === "Failed"
                        ? "Payment Failed"
                        : order.orderStatus}
                    </span>

                    {/* Retry Payment Button (Shows only on failed orders) */}
                    {order.paymentStatus === "Failed" &&
                      order.orderStatus !== "Cancelled" && (
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
                            padding: "0.4rem 0.9rem",
                            fontSize: "0.8rem",
                            background: "#dc2626",
                            borderColor: "#dc2626",
                          }}
                        >
                          Retry Payment ↻
                        </button>
                      )}

                    <Link
                      to={`/orders/${order.orderId}`}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {order.items.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.25rem",
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            style={{
                              width: "56px",
                              height: "72px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #f0f0f0",
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
                                margin: "0.2rem 0 0",
                                color: "#666",
                                fontSize: "0.82rem",
                              }}
                            >
                              {item.color} | Size: {item.size} | Qty:{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                          ₹{item.itemTotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
