import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export const CartPage = () => {
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotalCount,
    getShippingFee,
    getTotalAmount,
    hasInvalidItems,
    hasUnlistedItems,
    cartToast,
    fetchCart,
  } = useCart();

  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();

    const handleFocus = () => {
      fetchCart();
    };

    const interval = setInterval(() => {
      fetchCart();
    }, 5000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchCart]);

  const availableItems = cartItems.filter(
    (item) => item.isListed && item.stock > 0,
  );
  const soldOutItems = cartItems.filter((item) => item.stock <= 0);
  const overStockItems = cartItems.filter(
    (item) => item.isListed && item.stock > 0 && item.quantity > item.stock,
  );
  const unlistedItems = cartItems.filter((item) => !item.isListed);

  const subtotal = availableItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const totalCount = availableItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const shippingFee = subtotal === 0 ? 0 : subtotal >= 1500 ? 0 : 90;
  const totalAmount = subtotal + shippingFee;

  const hasUnlisted = unlistedItems.length > 0;
  const hasOverStock = overStockItems.length > 0;
  const hasSoldOut = soldOutItems.length > 0;

  const handleSaveForLater = async (item) => {
    await toggleWishlist({
      _id: item.productId,
      name: item.title,
      price: item.price,
      images: [item.image],
      variants: [
        {
          _id: item.variantId,
          color: item.color,
          size: item.size,
          price: item.price,
          stock: item.stock,
          images: [item.image],
        },
      ],
      totalStock: item.stock,
    });
    await removeFromCart(item.cartItemId);
  };

  return (
    <div className="cart-page-root">
      {/* Toast Notification */}
      {cartToast && (
        <div className={`cart-floating-toast ${cartToast.type}`}>
          {cartToast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="cart-header-row">
        <div>
          <span className="editorial-eyebrow">YOUR ATELIER BAG</span>
          <h1 className="editorial-title">Shopping Bag</h1>
        </div>
        {cartItems.length > 0 && (
          <button
            type="button"
            className="btn-clear-cart"
            onClick={clearCart}
            title="Remove all items from your bag"
          >
            <span className="btn-clear-icon">🗑️</span>
            <span>Clear Entire Bag</span>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div className="empty-cart-view">
          <div className="empty-cart-icon">👜</div>
          <h2>Your bag is currently empty</h2>
          <p>
            Explore our curated collections of minimal, natural fiber
            essentials.
          </p>
          <Link to="/collections" className="btn btn-primary btn-lg">
            Explore Collections &rarr;
          </Link>
        </div>
      ) : (
        /* Cart Layout: Items Table (Left) + Order Summary (Right) */
        <div className="cart-layout-grid">
          {/* Left Column: Items List */}
          <div className="cart-items-column">
            {hasUnlisted ? (
              <div className="cart-warning-banner">
                ⚠️ One or more garments in your bag are no longer available
                (unlisted). Please remove them before proceeding to checkout.
              </div>
            ) : hasOverStock ? (
              <div className="cart-warning-banner">
                ⚠️ Some garments in your bag exceed currently available stock.
                Please reduce their quantity before proceeding to checkout.
              </div>
            ) : null}

            {/* Structured Cart Table Card */}
            <div className="cart-table-card">
              <div className="cart-table-header">
                <span>Garment</span>
                <span>Unit Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>

              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const isUnlisted = !item.isListed;
                  const isOverStock =
                    item.isListed && item.stock > 0 && item.quantity > item.stock;
                  const isOut = item.stock <= 0;
                  const rowTotal = item.price * item.quantity;

                  return (
                    <div
                      key={item.cartItemId}
                      className={`cart-item-row ${isUnlisted || isOverStock ? "row-invalid" : ""} ${isOut ? "row-sold-out" : ""}`}
                      style={isUnlisted ? { opacity: 0.7 } : {}}
                    >
                      {/* Product Media & Info */}
                      <div className="cart-item-info">
                        <div className="cart-item-thumb-wrapper">
                          <Link
                            to={`/products/${item.productId}`}
                            className="cart-item-thumb"
                          >
                            <img src={item.image} alt={item.title} />
                          </Link>
                          {isOut && (
                            <span className="cart-sold-out-badge">SOLD OUT</span>
                          )}
                        </div>

                        <div className="cart-item-meta">
                          <Link
                            to={`/products/${item.productId}`}
                            className="cart-item-title"
                          >
                            {item.title}
                          </Link>
                          <div className="cart-item-spec">
                            <span>
                              Color: <strong>{item.color}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Size: <strong>{item.size}</strong>
                            </span>
                          </div>
                          {item.sku && (
                            <span className="cart-item-sku">SKU: {item.sku}</span>
                          )}

                          {/* Stock Warnings */}
                          {isUnlisted ? (
                            <span className="cart-stock-alert out">
                              Item Unavailable
                            </span>
                          ) : isOut ? (
                            <span className="cart-stock-alert out">
                              Sold Out
                            </span>
                          ) : isOverStock ? (
                            <span className="cart-stock-alert low">
                              Only {item.stock} left
                            </span>
                          ) : item.stock <= 3 ? (
                            <span className="cart-stock-alert few">
                              Few pieces left
                            </span>
                          ) : null}

                          {/* Row Actions */}
                          <div className="cart-item-actions">
                            <button
                              type="button"
                              className="cart-action-btn btn-save-later"
                              onClick={() => handleSaveForLater(item)}
                              title="Save to your wishlist"
                            >
                              <span className="action-icon">♡</span>
                              <span>Save for Later</span>
                            </button>
                            <button
                              type="button"
                              className="cart-action-btn btn-remove-item"
                              onClick={() => removeFromCart(item.cartItemId)}
                              title="Remove item from bag"
                            >
                              <span className="action-icon">✕</span>
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="cart-cell cart-cell-price">
                        ₹{item.price.toLocaleString()}
                      </div>

                      {/* Quantity Selector */}
                      <div className="cart-cell cart-cell-qty">
                        <div className="quantity-adjuster cart-adjuster">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.cartItemId,
                                item.quantity - 1,
                              )
                            }
                            disabled={isUnlisted || isOut || item.quantity <= 1}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.cartItemId,
                                item.quantity + 1,
                              )
                            }
                            disabled={
                              isUnlisted || isOut || item.quantity >= item.stock
                            }
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total for Row */}
                      <div
                        className="cart-cell cart-cell-total"
                        style={
                          isOut
                            ? {
                                textDecoration: "line-through",
                                color: "var(--text-muted)",
                              }
                            : {}
                        }
                      >
                        ₹{rowTotal.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cart-bottom-links">
              <Link to="/collections" className="continue-shopping-link">
                &larr; Continue Exploring Collections
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <aside className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-rows-group">
              <div className="summary-row">
                <span>
                  Subtotal ({totalCount} {totalCount === 1 ? "item" : "items"})
                </span>
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

              {/* Free Shipping Progress Indicator */}
              {subtotal > 0 && subtotal < 1500 ? (
                <div className="shipping-progress-box">
                  <div className="shipping-progress-text">
                    <span>
                      Add <strong>₹{(1500 - subtotal).toLocaleString()}</strong> more for <strong>FREE Delivery</strong>
                    </span>
                    <span>{Math.min(100, Math.round((subtotal / 1500) * 100))}%</span>
                  </div>
                  <div className="shipping-progress-track">
                    <div
                      className="shipping-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.round((subtotal / 1500) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : subtotal >= 1500 ? (
                <div className="shipping-unlocked-banner">
                  ✨ You've unlocked <strong>FREE Standard Delivery</strong>
                </div>
              ) : null}

              <div className="summary-row summary-total-row">
                <span>Estimated Total</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              className={`btn btn-primary btn-block checkout-submit-btn ${hasUnlisted || hasOverStock || availableItems.length === 0 ? "disabled" : ""}`}
              disabled={hasUnlisted || hasOverStock || availableItems.length === 0}
              onClick={() => navigate("/checkout")}
            >
              {hasUnlisted
                ? "Remove Unavailable Items"
                : hasOverStock
                  ? "Adjust Overstock Quantities"
                  : availableItems.length === 0
                    ? "All Items Are Sold Out"
                    : `Proceed to Checkout (${totalCount} ${totalCount === 1 ? "item" : "items"})`}
            </button>

            {/* Atelier Trust & Security Guarantees */}
            <div className="summary-trust-badges">
              <div className="summary-trust-item">
                <span className="summary-trust-icon">🛡️</span>
                <span>Authentic Atelier Quality Guaranteed</span>
              </div>
              <div className="summary-trust-item">
                <span className="summary-trust-icon">🚚</span>
                <span>Complimentary Delivery on Orders Over ₹1,500</span>
              </div>
              <div className="summary-trust-item">
                <span className="summary-trust-icon">🔄</span>
                <span>Hassle-Free 7-Day Returns & Exchanges</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
