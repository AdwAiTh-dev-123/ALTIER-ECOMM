import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { getStorefrontProductById } from "../../api/shopApi";
import "../../styles/storefront/WishlistPage.css";

export const WishlistPage = () => {
  const {
    wishlist,
    removeFromWishlist,
    clearWishlist,
    feedback,
    fetchWishlist,
  } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (fetchWishlist) {
      fetchWishlist();
    }
  }, [fetchWishlist]);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [localFeedback, setLocalFeedback] = useState(null);

  const handleMoveToCart = async (item) => {
    // Target the specific variant saved in the wishlist
    const targetVariant = item.selectedVariant || item.variants?.[0];

    if (!targetVariant || Number(targetVariant.stock) <= 0) {
      setLocalFeedback({
        type: "error",
        message: "This garment is currently out of stock.",
      });
      setTimeout(() => setLocalFeedback(null), 3500);
      return;
    }

    // Add that exact variant to cart
    const success = await addToCart(item, targetVariant, 1);

    // Automatically remove from wishlist once added to cart
    if (success) {
      removeFromWishlist(item._id, targetVariant?._id || item.variantId);
    }
  };

  return (
    <div className="wishlist-page-root">
      {/* Toast Feedback Notification */}
      {(feedback || localFeedback) && (
        <div
          className={`cart-floating-toast ${(localFeedback || feedback).type === "error" ? "error" : "success"}`}
        >
          {(localFeedback || feedback).message}
        </div>
      )}

      {/* Header Row */}
      <div className="cart-header-row">
        <div>
          <span className="editorial-eyebrow">SAVED SILHOUETTES</span>
          <h1 className="editorial-title">Your Wishlist</h1>
        </div>
        {wishlist.length > 0 && (
          <button
            type="button"
            className="btn-clear-cart"
            onClick={() => setShowClearConfirm(true)}
            title="Remove all saved garments"
          >
            Clear Entire Wishlist
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        /* Empty State */
        <div className="empty-cart-view">
          <div className="empty-cart-icon">🔖</div>
          <h2>Your wishlist is empty</h2>
          <p>
            Save pieces you love while browsing our catalog to revisit and
            acquire them later.
          </p>
          <Link to="/collections" className="btn btn-primary btn-lg">
            Explore Collections &rarr;
          </Link>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="wishlist-grid-container">
          <div className="products-grid">
            {wishlist.map((item) => {
              const displayImage = item.images?.[0];
              const title = item.name || item.title || "Untitled Garment";
              // Directly use the variant's out-of-stock status calculated by the backend
              const isOutOfStock = Boolean(item.isOutOfStock);

              return (
                <div
                  key={item.wishlistItemId || item._id}
                  className="wishlist-card"
                >
                  <div className="wishlist-card-media">
                    <Link to={`/products/${item._id}`}>
                      <img
                        src={displayImage}
                        alt={title}
                        className="wishlist-card-img"
                      />
                    </Link>

                    {/* Direct Remove Action */}
                    <button
                      type="button"
                      className="wishlist-remove-btn"
                      onClick={() => setItemToRemove(item)}
                      title="Remove from saved garments"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>

                    {isOutOfStock && (
                      <span className="stock-badge badge-out wishlist-out-badge">
                        Sold Out
                      </span>
                    )}
                  </div>

                  <div className="wishlist-card-body">
                    <span className="wishlist-card-category">
                      {item.category?.name || "Collection Piece"}
                    </span>
                    <Link
                      to={`/products/${item._id}`}
                      className="wishlist-card-title"
                    >
                      {title}
                    </Link>

                    {/* Displays the exact saved variant size & color */}
                    {(item.color || item.size) && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#78716c",
                          marginTop: "2px",
                        }}
                      >
                        {item.color} {item.size ? `• Size: ${item.size}` : ""}
                      </div>
                    )}

                    <span
                      className="wishlist-card-price"
                      style={{ marginTop: "4px" }}
                    >
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </span>

                    {/* Move to Bag Button */}
                    <button
                      type="button"
                      className={`btn btn-primary btn-block wishlist-move-btn ${
                        isOutOfStock ? "disabled" : ""
                      }`}
                      disabled={isOutOfStock}
                      onClick={() => handleMoveToCart(item)}
                    >
                      {isOutOfStock ? "Sold Out" : "Move to Bag →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Clear Wishlist Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="wishlist-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wishlist-confirm-icon">🔖</div>
            <h3 className="wishlist-confirm-title">Clear Entire Wishlist?</h3>
            <p className="wishlist-confirm-desc">
              Are you sure you want to remove all saved silhouettes from your
              wishlist?
            </p>
            <div className="wishlist-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary wishlist-confirm-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="wishlist-confirm-btn wishlist-confirm-btn-danger"
                onClick={() => {
                  clearWishlist();
                  setShowClearConfirm(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Item Remove Confirmation Modal */}
      {itemToRemove && (
        <div className="modal-backdrop" onClick={() => setItemToRemove(null)}>
          <div
            className="wishlist-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wishlist-confirm-icon">🔖</div>
            <h3 className="wishlist-confirm-title">Remove from Wishlist?</h3>
            <p className="wishlist-confirm-desc">
              Are you sure you want to remove{" "}
              <strong>
                "{itemToRemove.name || itemToRemove.title || "this garment"}"
              </strong>
              {(itemToRemove.color || itemToRemove.size) && (
                <span>
                  {" "}
                  ({itemToRemove.color || ""}
                  {itemToRemove.color && itemToRemove.size ? " · " : ""}
                  {itemToRemove.size ? `Size: ${itemToRemove.size}` : ""})
                </span>
              )}{" "}
              from your saved silhouettes?
            </p>
            <div className="wishlist-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary wishlist-confirm-btn"
                onClick={() => setItemToRemove(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="wishlist-confirm-btn wishlist-confirm-btn-danger"
                onClick={() => {
                  removeFromWishlist(
                    itemToRemove._id,
                    itemToRemove.variantId || itemToRemove.selectedVariant?._id,
                  );
                  setItemToRemove(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
