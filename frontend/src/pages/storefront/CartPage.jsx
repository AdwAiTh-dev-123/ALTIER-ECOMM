import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

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
    cartToast,
  } = useCart();

  const { toggleWishlist } = useWishlist();

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const totalAmount = getTotalAmount();
  const totalCount = getTotalCount();
  const invalid = hasInvalidItems();

  const handleSaveForLater = (item) => {
    toggleWishlist({
      _id: item.productId,
      name: item.title,
      price: item.price,
      images: [item.image],
    });
    removeFromCart(item.cartItemId);
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
            Clear Entire Bag
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div className="empty-cart-view">
          <div className="empty-cart-icon">👜</div>
          <h2>Your bag is currently empty</h2>
          <p>Explore our curated collections of minimal, natural fiber essentials.</p>
          <Link to="/collections" className="btn btn-primary btn-lg">
            Explore Collections &rarr;
          </Link>
        </div>
      ) : (
        /* Cart Layout: Items Table (Left) + Order Summary (Right) */
        <div className="cart-layout-grid">
          {/* Left Column: Items List */}
          <div className="cart-items-column">
            {invalid && (
              <div className="cart-warning-banner">
                ⚠️ Some garments in your bag exceed currently available stock. Please reduce their quantity before proceeding to checkout.
              </div>
            )}

            <div className="cart-table-header">
              <span>Garment</span>
              <span>Unit Price</span>
              <span>Quantity</span>
              <span>Item Total</span>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => {
                const isOverStock = item.quantity > item.stock;
                const isOut = item.stock <= 0;
                const rowTotal = item.price * item.quantity;

                return (
                  <div
                    key={item.cartItemId}
                    className={`cart-item-row ${isOverStock || isOut ? 'row-invalid' : ''}`}
                  >
                    {/* Product Media & Info */}
                    <div className="cart-item-info">
                      <Link to={`/products/${item.productId}`} className="cart-item-thumb">
                        <img src={item.image} alt={item.title} />
                      </Link>

                      <div className="cart-item-meta">
                        <Link to={`/products/${item.productId}`} className="cart-item-title">
                          {item.title}
                        </Link>
                        <div className="cart-item-spec">
                          <span>Color: <strong>{item.color}</strong></span>
                          <span>·</span>
                          <span>Size: <strong>{item.size}</strong></span>
                        </div>
                        {item.sku && <span className="cart-item-sku">SKU: {item.sku}</span>}

                        {/* Stock Warnings */}
                        {isOut ? (
                          <span className="cart-stock-alert out">Sold Out — Please remove</span>
                        ) : isOverStock ? (
                          <span className="cart-stock-alert low">
                            Only {item.stock} pieces in stock (you selected {item.quantity})
                          </span>
                        ) : item.stock <= 3 ? (
                          <span className="cart-stock-alert few">Few pieces remaining</span>
                        ) : null}

                        {/* Row Actions */}
                        <div className="cart-item-actions">
                          <button
                            type="button"
                            className="cart-action-btn"
                            onClick={() => handleSaveForLater(item)}
                          >
                            Save for Later
                          </button>
                          <span className="action-divider">|</span>
                          <button
                            type="button"
                            className="cart-action-btn btn-danger-text"
                            onClick={() => removeFromCart(item.cartItemId)}
                          >
                            Remove
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
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>


                    {/* Total for Row */}
                    <div className="cart-cell cart-cell-total">
                      ₹{rowTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })}
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
                <span>Subtotal ({totalCount} {totalCount === 1 ? 'item' : 'items'})</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Standard Delivery</span>
                <span>{shippingFee === 0 ? <strong style={{ color: 'var(--success)' }}>FREE</strong> : `₹${shippingFee}`}</span>
              </div>

              {shippingFee > 0 && (
                <div className="shipping-progress-hint">
                  Add <strong>₹{(1500 - subtotal).toLocaleString()}</strong> more to qualify for Free Shipping.
                </div>
              )}

              <div className="summary-row summary-total-row">
                <span>Estimated Total</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button: Disabled if invalid items or empty */}
            <button
              type="button"
              className={`btn btn-primary btn-block checkout-submit-btn ${invalid ? 'disabled' : ''}`}
              disabled={invalid || cartItems.length === 0}
              onClick={() => alert("Proceeding to checkout step")}
            >
              {invalid ? 'Resolve Stock Issues' : 'Proceed to Checkout'}
            </button>
          </aside>

        </div>
      )}
    </div>
  );
};

export default CartPage;
