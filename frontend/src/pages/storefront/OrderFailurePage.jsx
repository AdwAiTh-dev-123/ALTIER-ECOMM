import { useEffect, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  getOrderByIdApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  recordPaymentFailureApi,
} from "../../api/shopApi";
import { useCart } from "../../context/CartContext";
import "../../styles/storefront/OrderFailurePage.css";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-script")) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const OrderFailurePage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchCart } = useCart();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    location.state?.reason || "Your payment could not be processed.",
  );

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const res = await getOrderByIdApi(orderId);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        setErrorMessage("Unable to fetch order information.");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Retry payment without creating a duplicate order
  const handleRetryPayment = async () => {
    try {
      setIsRetrying(true);
      setErrorMessage("");

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMessage(
          "Failed to load Razorpay. Please check your connection.",
        );
        setIsRetrying(false);
        return;
      }

      // Re-use existing order record with retryOrderId
      const res = await createRazorpayOrderApi({ retryOrderId: order.orderId });
      if (!res.data.success) {
        setErrorMessage(res.data.message || "Failed to restart payment.");
        setIsRetrying(false);
        return;
      }

      const { keyId, razorpayOrderId, amount, currency } = res.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "ALTIER",
        description: `Retry Payment: ${order.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: order.shippingAddress?.fullName || "",
          contact: order.shippingAddress?.phone || "",
        },
        theme: {
          color: "#111111",
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyRazorpayPaymentApi({
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await fetchCart();
              navigate(`/orders/success/${order.orderId}`, {
                replace: true,
                state: { order: verifyRes.data.order },
              });
            } else {
              setErrorMessage(
                verifyRes.data.message || "Payment verification failed.",
              );
            }
          } catch (vErr) {
            setErrorMessage(
              vErr.response?.data?.message || "Verification failed on retry.",
            );
          }
        },
        modal: {
          ondismiss: async function () {
            await recordPaymentFailureApi({
              orderId: order.orderId,
              reason: "Customer cancelled retry modal.",
            });
            setErrorMessage(
              "Retry session dismissed. You can try again whenever you are ready.",
            );
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", async function (response) {
        await recordPaymentFailureApi({
          orderId: order.orderId,
          reason: response.error?.description || "Retry payment failed",
        });
        setErrorMessage(
          response.error?.description || "Payment attempt declined.",
        );
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to initiate payment retry. Please try again.",
      );
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading-state" style={{ padding: "6rem 0" }}>
        <div className="cart-spinner-small"></div>
        <p>Loading order status...</p>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      {/* Failure Header */}
      <div className="order-success-card order-failure-card">
        <div className="success-icon-badge failure-icon-badge">
          ✕
        </div>
        <span className="editorial-eyebrow failure-eyebrow">
          PAYMENT INCOMPLETE
        </span>
        <h1 className="success-heading">Payment Failed or Cancelled</h1>
        <p className="success-subheading failure-subheading">
          {errorMessage}
        </p>

        {order && (
          <div className="order-id-pill">
            Order Reference: <strong>{order.orderId}</strong>
          </div>
        )}

        <div className="failure-actions-row">
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying}
            className="btn btn-primary failure-btn-action"
          >
            {isRetrying ? "Pls wait..." : "Retry Payment Now"}
          </button>
          <Link
            to="/cart"
            className="btn btn-secondary failure-btn-action"
          >
            Return to Cart
          </Link>
        </div>
      </div>

      {order && (
        <div className="order-details-grid">
          <div className="order-receipt-card">
            <h3 className="card-heading">Items Reserved in Order</h3>
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
          </div>

          <div className="order-meta-card">
            <h3 className="card-heading">Order Total</h3>
            <div className="receipt-totals-box failure-receipt-totals">
              <div className="receipt-row">
                <span>Subtotal</span>
                <span>₹{order.pricing.subtotal.toLocaleString()}</span>
              </div>
              <div className="receipt-row">
                <span>Delivery</span>
                <span>
                  {order.pricing.shippingFee === 0
                    ? "FREE"
                    : `₹${order.pricing.shippingFee}`}
                </span>
              </div>
              <div className="receipt-row receipt-grand-total">
                <span>Amount Due</span>
                <span>₹{order.pricing.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div
              style={{
                marginTop: "1.5rem",
                fontSize: "0.85rem",
                color: "#666",
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFailurePage;
