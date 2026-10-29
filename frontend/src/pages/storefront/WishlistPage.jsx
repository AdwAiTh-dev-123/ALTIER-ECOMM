import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { getStorefrontProductById } from '../../api/shopApi';

export const WishlistPage = () => {
  const { wishlist, removeFromWishlist, clearWishlist, feedback, fetchWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (fetchWishlist) {
      fetchWishlist();
    }
  }, [fetchWishlist]);

  const handleMoveToCart = async (product) => {
    // 1. Identify in-stock variant from memory
    let variants = Array.isArray(product.variants) ? product.variants : [];

    // Fallback: If variants are not in memory, fetch fresh from product API
    if (variants.length === 0 && product._id) {
      try {
        const res = await getStorefrontProductById(product._id);
        const fetchedProd = res.data?.data || res.data?.product || {};
        variants = Array.isArray(fetchedProd.variants) ? fetchedProd.variants : [];
      } catch (err) {
        console.error('Failed to load product variants:', err);
      }
    }

    const variant = variants.find((v) => Number(v.stock) > 0) || variants[0];

    if (!variant || (variant.stock !== undefined && Number(variant.stock) <= 0)) {
      alert('This garment is currently out of stock.');
      return;
    }

    // 2. Add to cart
    const success = await addToCart(product, variant, 1);

    // 3. Automatically remove from wishlist once added to cart
    if (success) {
      removeFromWishlist(product._id);
    }
  };

  return (
    <div className="wishlist-page-root">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div className={`cart-floating-toast ${feedback.type === 'error' ? 'error' : 'success'}`}>
          {feedback.message}
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
            onClick={clearWishlist}
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
          <p>Save pieces you love while browsing our catalog to revisit and acquire them later.</p>
          <Link to="/collections" className="btn btn-primary btn-lg">
            Explore Collections &rarr;
          </Link>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="wishlist-grid-container">
          <div className="products-grid">
            {wishlist.map((item) => {
              const displayImage =
                item.images?.[0] ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
              const title = item.name || item.title || 'Untitled Garment';
              const variants = Array.isArray(item.variants) ? item.variants : [];
              const variantPrices = variants
                .map((v) => Number(v.price))
                .filter((p) => !isNaN(p) && p > 0);

              // Calculate resolved price: check item.price, or lowest variant price, or basePrice
              const resolvedPrice =
                item.price && Number(item.price) > 0
                  ? Number(item.price)
                  : variantPrices.length > 0
                  ? Math.min(...variantPrices)
                  : item.basePrice || 0;

              const totalStock =
                item.totalStock ??
                variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              const isOutOfStock = totalStock <= 0 && variants.length > 0;

              return (
                <div key={item._id} className="wishlist-card">
                  <div className="wishlist-card-media">
                    <Link to={`/products/${item._id}`}>
                      <img src={displayImage} alt={title} className="wishlist-card-img" />
                    </Link>

                    {/* Direct Remove Action */}
                    <button
                      type="button"
                      className="wishlist-remove-btn"
                      onClick={() => removeFromWishlist(item._id)}
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
                      {item.category?.name || 'Studio Piece'}
                    </span>
                    <Link to={`/products/${item._id}`} className="wishlist-card-title">
                      {title}
                    </Link>
                    <span className="wishlist-card-price">
                      ₹{Number(resolvedPrice).toLocaleString()}
                    </span>

                    {/* Move to Bag Button */}
                    <button
                      type="button"
                      className={`btn btn-primary btn-block wishlist-move-btn ${
                        isOutOfStock ? 'disabled' : ''
                      }`}
                      disabled={isOutOfStock}
                      onClick={() => handleMoveToCart(item)}
                    >
                      {isOutOfStock ? 'Sold Out' : 'Move to Bag →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
