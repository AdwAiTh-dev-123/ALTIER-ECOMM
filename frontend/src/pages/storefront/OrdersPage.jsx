import { useState, useEffect, useRef } from "react";
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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const STATUS_TABS = [
    { id: "ALL", label: "All Orders" },
    { id: "ACTIVE", label: "Active" },
    { id: "FAILED", label: "Failed" },
    { id: "Delivered", label: "Delivered" },
    { id: "Cancelled", label: "Cancelled" },
  ];

  const currentTabLabel =
    STATUS_TABS.find((t) => t.id === statusFilter)?.label || "All Orders";

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
        {/* Desktop: Status Filter Tabs */}
        <div className="orders-status-pills">
          {STATUS_TABS.map((tab) => (
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

        {/* Mobile: In-DOM Custom Status Dropdown */}
        <div className="orders-status-dropdown-wrapper" ref={statusDropdownRef}>
          <button
            type="button"
            className="orders-status-dropdown-btn"
            onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
            aria-expanded={isStatusDropdownOpen}
          >
            <span className="orders-dropdown-btn-text">
              Status: <strong>{currentTabLabel}</strong>
            </span>
            <span
              className={`orders-dropdown-chevron ${isStatusDropdownOpen ? "open" : ""}`}
            >
              ▾
            </span>
          </button>

          {isStatusDropdownOpen && (
            <div className="orders-status-dropdown-menu">
              {STATUS_TABS.map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`orders-dropdown-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setIsStatusDropdownOpen(false);
                    }}
                  >
                    <span>{tab.label}</span>
                    {isSelected && <span className="dropdown-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="orders-search-box">
          <input
            type="text"
            placeholder="Search by Order ID or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="orders-search-input"
          />
          <button type="submit" className="btn btn-secondary">
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
          <h3 className="orders-empty-title">No orders found</h3>
          <p className="orders-empty-desc">
            {searchTerm || statusFilter !== "ALL"
              ? "No orders match your filter criteria."
              : "You haven't placed any orders yet."}
          </p>
          <Link to="/collections" className="btn btn-primary">
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

            const isFailed = order.paymentStatus === "Failed";
            const isDelivered = order.orderStatus === "Delivered";
            const isCancelled = order.orderStatus === "Cancelled";
            const badgeClass = isFailed
              ? "badge-failed"
              : isDelivered
                ? "badge-delivered"
                : isCancelled
                  ? "badge-cancelled"
                  : "badge-active";

            return (
              <div key={order._id} className="order-history-card">
                {/* Order Top Bar */}
                <div className="order-history-header">
                  <div className="order-history-meta-group">
                    <div className="order-meta-item">
                      <span className="order-history-meta-label">
                        Order Placed
                      </span>
                      <strong className="order-history-meta-value">
                        {formattedDate}
                      </strong>
                    </div>
                    <div className="order-meta-item">
                      <span className="order-history-meta-label">
                        Total Amount
                      </span>
                      <strong className="order-history-meta-value">
                        ₹{order.pricing.totalAmount.toLocaleString()}
                      </strong>
                    </div>
                    <div className="order-meta-item order-meta-ref">
                      <span className="order-history-meta-label">
                        Order Reference
                      </span>
                      <strong className="order-history-meta-value order-history-code">
                        {order.orderId}
                      </strong>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="order-history-actions-group">
                    {/* Status Badge */}
                    <span className={`order-status-badge ${badgeClass}`}>
                      ● {isFailed ? "Payment Failed" : order.orderStatus}
                    </span>

                    {/* Action Buttons */}
                    <div className="order-action-btns">
                      {isFailed && order.orderStatus !== "Cancelled" && (
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
                          className="btn btn-primary order-btn-retry"
                        >
                          Retry Payment ↻
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.orderId}`}
                        className="btn btn-secondary order-btn-details"
                      >
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="order-history-items-body">
                  <div className="order-items-list">
                    {order.items.map((item) => (
                      <div key={item._id} className="order-history-item-row">
                        <div className="order-history-item-info">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="order-history-item-img"
                          />
                          <div className="order-history-item-details">
                            <h4 className="order-history-item-name">
                              {item.title}
                            </h4>
                            <p className="order-history-item-spec">
                              {item.color} | Size: {item.size} | Qty:{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="order-history-item-price">
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
