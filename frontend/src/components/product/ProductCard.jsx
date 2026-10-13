import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';

export const ProductCard = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isSaved = isInWishlist(product._id);

  const colors = [...new Set(product.variants.map(v => v.color))];
  const sizes = [...new Set(product.variants.map(v => v.size))];
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <Link to={`/products/${product._id}`}>
          <img
            src={product.images[0]}
            alt={product.title}
            className="product-card-image"
            loading="lazy"
          />
        </Link>

        {/* Status / Feature Badges */}
        <div className="card-top-badges">
          {totalStock === 0 ? (
            <span className="stock-badge badge-out">Out of Stock</span>
          ) : totalStock <= 15 ? (
            <span className="stock-badge badge-low-stock">Few Pieces Left</span>
          ) : (
            <span className="stock-badge badge-editorial">New Season</span>
          )}
        </div>

        {/* Save to Wishlist Button */}
        <button
          type="button"
          className={`card-save-btn ${isSaved ? 'is-saved' : ''}`}
          onClick={handleSaveClick}
          aria-label={isSaved ? "Remove from saved items" : "Save garment for later"}
          title={isSaved ? "Remove from saved items" : "Save for later"}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <div className="product-card-info">
        <div className="product-card-header">
          <Link to={`/products/${product._id}`} className="product-card-title">
            {product.title}
          </Link>
          <span className="product-card-price">₹{product.basePrice.toLocaleString()}</span>
        </div>

        {/* Variants Quick Overview with Color Dots */}
        <div className="product-card-variants-row">
          <div className="card-swatches-list">
            {colors.slice(0, 5).map(col => (
              <span
                key={col}
                className="card-color-dot"
                data-color={col}
                title={col}
              />
            ))}
          </div>
          <span className="variant-label-sm">
            {colors.length} {colors.length === 1 ? 'Color' : 'Colors'} · {sizes.join(', ')}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
