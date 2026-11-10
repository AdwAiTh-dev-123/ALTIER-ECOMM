import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  getAddressesApi,
  addAddressApi,
  updateAddressApi,
  placeCodOrderApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  recordPaymentFailureApi,
  getWalletApi,
  placeWalletOrderApi,
  applyCouponApi,
} from "../../api/shopApi";
import AddressModal from "../../components/common/AddressModal";

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

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, getSubtotal, getShippingFee, getTotalAmount, fetchCart } =
    useCart();

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Payment state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isOrderPlacedRef = useRef(false);

  //wallet state
  const [walletBalance, setWalletBalance] = useState(0);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Fetch addresses and auto-select default
  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await getAddressesApi();
      if (res.data.success) {
        const list = res.data.addresses || [];
        setAddresses(list);

        // Pre-select default address, or the first address available
        const defaultAddr = list.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (list.length > 0) {
          setSelectedAddressId(list[0]._id);
        }
      }
    } catch (err) {
      setErrorMessage("Unable to load shipping addresses. Please refresh.");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();

    getWalletApi()
      .then((res) => {
        if (res.data.success && res.data.wallet) {
          setWalletBalance(res.data.wallet.balance || 0);
        }
      })
      .catch(() => {});
  }, []);

  const availableCartItems = cartItems.filter(
    (item) => item.isListed && item.stock > 0,
  );

  useEffect(() => {
    if (
      !isOrderPlacedRef.current &&
      (cartItems.length === 0 || availableCartItems.length === 0)
    ) {
      navigate("/cart", { replace: true });
    }
  }, [cartItems, availableCartItems.length, navigate]);

  const subtotal = getSubtotal();
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee =
    subtotal - couponDiscount >= 1500 || subtotal >= 1500 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - couponDiscount) + shippingFee;

  // Save new address from modal and select it immediately
  const handleSaveAddress = async (formData) => {
    if (editingAddress) {
      const res = await updateAddressApi(editingAddress._id, formData);
      if (res.data.success) {
        await loadAddresses();
      }
    } else {
      const res = await addAddressApi(formData);
      if (res.data.success && res.data.address) {
        await loadAddresses();
        setSelectedAddressId(res.data.address._id);
      }
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async () => {
    setErrorMessage("");

    if (!selectedAddressId) {
      setErrorMessage(
        "Please select or add a delivery address before placing your order.",
      );
      return;
    }

    if (paymentMethod === "COD" || paymentMethod === "WALLET") {
      if (paymentMethod === "WALLET" && walletBalance < totalAmount) {
        setErrorMessage(
          `Insufficient wallet balance (Available: ₹${walletBalance}). Please select another payment method or add funds.`,
        );
        return;
      }
      setIsConfirmModalOpen(true);
      return;
    }
    executeOrderPlacement();
  };
  const executeOrderPlacement = async () => {
    setIsConfirmModalOpen(false);
    setErrorMessage("");

    if (paymentMethod === "COD") {
      try {
        setIsSubmitting(true);
        const res = await placeCodOrderApi({
          addressId: selectedAddressId,
          couponCode: appliedCoupon?.code || null,
        });
        if (res.data.success && res.data.order) {
          isOrderPlacedRef.current = true;
          await fetchCart();
          navigate(`/orders/success/${res.data.order.orderId}`, {
            replace: true,
            state: { order: res.data.order },
          });
        }

        if (res.data.success && res.data.order) {
          // Re-sync cart context so navbar badge updates to 0
          await fetchCart();
          navigate(`/orders/success/${res.data.order.orderId}`, {
            replace: true,
            state: { order: res.data.order },
          });
        }
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message ||
            "Failed to place order. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (paymentMethod === "WALLET") {
      try {
        setIsSubmitting(true);
        const res = await placeWalletOrderApi({
          addressId: selectedAddressId,
          couponCode: appliedCoupon?.code || null,
        });

        if (res.data.success && res.data.order) {
          isOrderPlacedRef.current = true;
          await fetchCart();
          navigate(`/orders/success/${res.data.order.orderId}`, {
            replace: true,
            state: { order: res.data.order },
          });
        }
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message || "Failed to place order with wallet",
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // ONLINE (RAZORPAY) FLOW
      try {
        setIsSubmitting(true);

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          setErrorMessage(
            "Failed to load payment gateway. Please check your internet connection.",
          );
          setIsSubmitting(false);
          return;
        }

        // 1. Ask backend to register the order with Razorpay
        const res = await createRazorpayOrderApi({
          addressId: selectedAddressId,
          couponCode: appliedCoupon?.code || null,
        });
        if (!res.data.success) {
          setErrorMessage(res.data.message || "Failed to initialize payment.");
          setIsSubmitting(false);
          return;
        }

        const { keyId, razorpayOrderId, amount, currency, orderId } = res.data;
        const currentAddress = addresses.find(
          (a) => a._id === selectedAddressId,
        );

        // 2. Configure Razorpay modal
        const options = {
          key: keyId,
          amount,
          currency,
          name: "ALTIER",
          description: `Order ${orderId}`,
          order_id: razorpayOrderId,
          prefill: {
            name: currentAddress?.fullName || "",
            contact: currentAddress?.phone || "",
          },
          theme: {
            color: "#111111",
          },
          handler: async function (response) {
            try {
              // 3. Verify HMAC signature on backend
              const verifyRes = await verifyRazorpayPaymentApi({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                isOrderPlacedRef.current = true;
                await fetchCart();
                navigate(`/orders/success/${orderId}`, {
                  replace: true,
                  state: { order: verifyRes.data.order },
                });
              } else {
                navigate(`/orders/failure/${orderId}`, {
                  replace: true,
                  state: { reason: verifyRes.data.message },
                });
              }
            } catch (vErr) {
              navigate(`/orders/failure/${orderId}`, {
                replace: true,
                state: {
                  reason:
                    vErr.response?.data?.message ||
                    "Signature verification failed",
                },
              });
            }
          },
          modal: {
            ondismiss: async function () {
              try {
                await recordPaymentFailureApi({
                  orderId,
                  reason: "Customer closed the checkout window.",
                });
              } catch (e) {
                console.error("Failed to record dismissal", e);
              }
              navigate(`/orders/failure/${orderId}`, {
                replace: true,
                state: {
                  reason: "Payment window was dismissed before completion.",
                },
              });
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);

        razorpayInstance.on("payment.failed", async function (response) {
          try {
            await recordPaymentFailureApi({
              orderId,
              reason:
                response.error?.description || "Card or bank declined payment",
            });
          } catch (e) {
            console.error("Failed to record failure", e);
          }
          navigate(`/orders/failure/${orderId}`, {
            replace: true,
            state: {
              reason:
                response.error?.description || "Payment failed at gateway.",
            },
          });
        });

        razorpayInstance.open();
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message ||
            "Unable to start online payment. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await applyCouponApi(couponInput.trim().toUpperCase());
      if (res.data.success) {
        setAppliedCoupon({
          code: res.data.data.coupon.code,
          discountAmount: res.data.data.discountAmount,
          description: res.data.data.coupon.description,
        });
        setCouponSuccess(
          `Coupon "${res.data.data.coupon.code}" applied: ₹${res.data.data.discountAmount} saved!`,
        );
        setCouponInput("");
      }
    } catch (err) {
      setCouponError(
        err.response?.data?.message || "Invalid or ineligible coupon code.",
      );
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponSuccess("");
  };

  return (
    <div className="checkout-page-root">
      {/* Header */}
      <div className="checkout-page-header">
        <span className="editorial-eyebrow">ORDER FINALIZATION</span>
        <h1 className="editorial-title">Checkout</h1>
      </div>

      {errorMessage && (
        <div
          className="cart-inline-error-banner"
          style={{ marginBottom: "1.5rem" }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="checkout-grid-layout">
        {/* Left Column: Addresses & Payment Selection */}
        <div className="checkout-main-column">
          {/* Section 1: Delivery Address */}
          <section className="checkout-section-card">
            <div className="checkout-section-header">
              <div>
                <span className="section-step-num">1</span>
                <h2 className="checkout-section-title">Delivery Address</h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingAddress(null);
                  setIsModalOpen(true);
                }}
              >
                + Add New Address
              </button>
            </div>

            {isLoadingAddresses ? (
              <div className="profile-loading-state">
                <div className="cart-spinner-small"></div>
                <p>Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div
                className="addresses-empty-card"
                style={{ padding: "2.5rem 1.5rem" }}
              >
                <p style={{ margin: "0 0 1rem" }}>
                  You don't have any saved shipping addresses yet.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingAddress(null);
                    setIsModalOpen(true);
                  }}
                >
                  Add Shipping Address
                </button>
              </div>
            ) : (
              <div className="checkout-address-options">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      className={`checkout-address-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedAddressId(addr._id)}
                    >
                      <div className="checkout-radio-wrapper">
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr._id)}
                          id={`addr-${addr._id}`}
                        />
                      </div>

                      <div className="checkout-address-content">
                        <div className="checkout-addr-header">
                          <label
                            htmlFor={`addr-${addr._id}`}
                            className="checkout-recipient-name"
                          >
                            {addr.fullName}
                          </label>
                          <span className="address-type-tag">
                            {addr.addressType}
                          </span>
                          {addr.isDefault && (
                            <span className="address-default-badge">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="checkout-addr-text">
                          {addr.streetAddress}
                          {addr.apartment ? `, ${addr.apartment}` : ""}
                        </p>
                        <p className="checkout-addr-text">
                          {addr.city}, {addr.state} -{" "}
                          <strong>{addr.postalCode}</strong>
                        </p>
                        <p className="checkout-addr-phone">
                          Phone: +91 {addr.phone}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="checkout-addr-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddress(addr);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Payment Options */}
          <section
            className="checkout-section-card"
            style={{ marginTop: "2rem" }}
          >
            <div className="checkout-section-header">
              <div>
                <span className="section-step-num">2</span>
                <h2 className="checkout-section-title">Payment Method</h2>
              </div>
            </div>

            <div className="payment-options-group">
              {/* Option: Cash on Delivery */}
              <label
                className={`payment-option-card ${paymentMethod === "COD" ? "selected" : ""}`}
              >
                <div className="checkout-radio-wrapper">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                <div className="payment-option-details">
                  <span className="payment-title">Cash on Delivery (COD)</span>
                  <p className="payment-desc">
                    Pay with cash or UPI directly to the courier when your order
                    is delivered.
                  </p>
                </div>
              </label>

              {/* Option: Razorpay Online Payment */}
              <label
                className={`payment-option-card ${paymentMethod === "RAZORPAY" ? "selected" : ""}`}
              >
                <div className="checkout-radio-wrapper">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                <div className="payment-option-details">
                  <span className="payment-title">Razorpay Online Payment</span>
                  <p className="payment-desc">
                    Instant & secure payment via Credit/Debit Cards, UPI, or
                    NetBanking.
                  </p>
                </div>
              </label>

              {/* Option: Wallet Payment */}
              <label
                className={`payment-option-card ${paymentMethod === "WALLET" ? "selected" : ""}`}
                style={{
                  opacity: walletBalance < totalAmount ? 0.6 : 1,
                  cursor:
                    walletBalance < totalAmount ? "not-allowed" : "pointer",
                }}
              >
                <div className="checkout-radio-wrapper">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="WALLET"
                    checked={paymentMethod === "WALLET"}
                    onChange={(e) => {
                      if (walletBalance >= totalAmount) {
                        setPaymentMethod(e.target.value);
                      }
                    }}
                    disabled={walletBalance < totalAmount}
                  />
                </div>
                <div
                  className="payment-option-details"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="payment-title">Altier Wallet</span>
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        color:
                          walletBalance >= totalAmount ? "#137333" : "#c5221f",
                      }}
                    >
                      Balance: ₹{walletBalance}
                    </span>
                  </div>
                  <p className="payment-desc">
                    {walletBalance >= totalAmount
                      ? "Pay instantly using your available wallet balance."
                      : `Insufficient balance (Need ₹${totalAmount}). Please choose another payment method or top up your wallet in your profile.`}
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary Card */}
        <aside className="checkout-summary-column">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            {/* Ordered Items Preview */}
            <div className="checkout-items-preview">
              {availableCartItems.map((item) => (
                <div key={item.cartItemId} className="checkout-item-row">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="checkout-item-thumb"
                  />
                  <div className="checkout-item-info">
                    <h4 className="checkout-item-title">{item.title}</h4>
                    <span className="checkout-item-variant">
                      {item.color} / {item.size} × {item.quantity}
                    </span>
                  </div>
                  <span className="checkout-item-price">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div
              style={{
                marginTop: "1rem",
                marginBottom: "1rem",
                borderTop: "1px solid #e7e5e4",
                paddingTop: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "#44403c",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Promo / Coupon Code (Optional)
              </span>

              {appliedCoupon ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f0fdf4",
                    border: "1px dashed #16a34a",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: "700",
                        color: "#166534",
                        fontSize: "0.85rem",
                      }}
                    >
                      🏷️ {appliedCoupon.code}
                    </span>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "#15803d",
                        marginLeft: "6px",
                      }}
                    >
                      (-₹{appliedCoupon.discountAmount})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                    }}
                    title="Remove coupon"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Enter coupon code..."
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.65rem",
                        fontSize: "0.85rem",
                        border: "1px solid #d6d3d1",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      style={{
                        padding: "0.45rem 0.85rem",
                        fontSize: "0.82rem",
                      }}
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>

                  {couponError && (
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: "0.78rem",
                        marginTop: "0.4rem",
                      }}
                    >
                      {couponError}
                    </div>
                  )}
                  {couponSuccess && (
                    <div
                      style={{
                        color: "#15803d",
                        fontSize: "0.78rem",
                        marginTop: "0.4rem",
                      }}
                    >
                      {couponSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In the summary rows */}

            <div className="summary-rows-group" style={{ marginTop: "1.5rem" }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Standard Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <strong style={{ color: "var(--success)" }}>FREE</strong>
                  ) : (
                    `₹${shippingFee}`
                  )}
                </span>
              </div>

              <div className="summary-row summary-total-row">
                <span>Payable Total</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block checkout-submit-btn"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || addresses.length === 0}
            >
              {isSubmitting
                ? "Placing Order..."
                : paymentMethod === "COD"
                  ? "Confirm & Place Order (COD)"
                  : `Pay ₹${totalAmount.toLocaleString()}`}
            </button>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <Link
                to="/cart"
                className="continue-shopping-link"
                style={{ fontSize: "0.85rem" }}
              >
                &larr; Return to Bag
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Checkout Confirmation Modal for COD & Wallet */}
      {isConfirmModalOpen && (
        <div className="admin-order-modal-backdrop">
          <div className="admin-order-modal-card" style={{ maxWidth: "460px" }}>
            <h3
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1.25rem",
                color: "#1c1917",
              }}
            >
              Confirm Your Order
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "0.88rem",
                marginBottom: "1.25rem",
              }}
            >
              Please review your payment and shipping details before we place
              your order.
            </p>

            <div
              style={{
                background: "#fafaf9",
                border: "1px solid #e7e5e4",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "#78716c" }}>Payment Method:</span>
                <strong style={{ color: "#1c1917" }}>
                  {paymentMethod === "COD"
                    ? "Cash on Delivery (COD)"
                    : "Altier Wallet"}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "#78716c" }}>Total Amount:</span>
                <strong style={{ color: "#1c1917", fontSize: "1.05rem" }}>
                  ₹{totalAmount.toLocaleString("en-IN")}
                </strong>
              </div>

              {paymentMethod === "WALLET" && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "#15803d",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px dashed #e7e5e4",
                  }}
                >
                  Remaining balance after order: ₹
                  {(walletBalance - totalAmount).toLocaleString("en-IN")}
                </div>
              )}

              {paymentMethod === "COD" && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "#b45309",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px dashed #e7e5e4",
                  }}
                >
                  💵 Please keep exact cash ready upon delivery.
                </div>
              )}
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
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Go Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: "#1c1917", borderColor: "#1c1917" }}
                onClick={executeOrderPlacement}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Placing..." : "Confirm & Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />
    </div>
  );
};

export default CheckoutPage;
