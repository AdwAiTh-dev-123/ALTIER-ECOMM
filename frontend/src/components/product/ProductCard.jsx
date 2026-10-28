import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";

export const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isSaved = isInWishlist(product._id);

  // Fallback support for name/title and price/basePrice
  const title = product.name || product.title || "Untitled Garment";
  const price = product.price ?? product.basePrice ?? 0;

  // Safe variant parsing
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const colors = product.availableColors || [
    ...new Set(variants.map((v) => v.color).filter(Boolean)),
  ];
  const sizes = product.availableSizes || [
    ...new Set(variants.map((v) => v.size).filter(Boolean)),
  ];
  const totalStock =
    product.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  // Image fallback
  const firstImage =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800";

  const isAdmin = user?.role === "admin";

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) return;
    if (!user) {
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <Link to={`/products/${product._id}`}>
          <img
            src={firstImage}
            alt={title}
            className="product-card-image"
            loading="lazy"
          />
        </Link>

        {/* Status Badges */}
        <div className="card-top-badges">
          {totalStock === 0 ? (
            <span className="stock-badge badge-out">Out of Stock</span>
          ) : totalStock <= 10 ? (
            <span className="stock-badge badge-low-stock">Few Pieces Left</span>
          ) : (
            <span className="stock-badge badge-editorial">In Stock</span>
          )}
        </div>

        {/* Wishlist Button - Customers Only */}
        {!isAdmin && (
          <button
            type="button"
            className={`card-save-btn ${isSaved ? "is-saved" : ""}`}
            onClick={handleSaveClick}
            aria-label={
              isSaved ? "Remove from saved items" : "Save garment for later"
            }
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
        )}
      </div>

      <div className="product-card-info">
        <div className="product-card-header">
          <Link to={`/products/${product._id}`} className="product-card-title">
            {title}
          </Link>
          <span className="product-card-price">
            ₹{Number(price).toLocaleString()}
          </span>
        </div>

        {/* Variants info */}
        <div className="product-card-variants-row">
          {colors.length > 0 && (
            <div className="card-swatches-list">
              {colors.slice(0, 5).map((col) => (
                <span
                  key={col}
                  className="card-color-dot"
                  data-color={col}
                  title={col}
                  style={{
                    backgroundColor: col.toLowerCase().includes("white")
                      ? "#ffffff"
                      : col.toLowerCase().includes("black")
                        ? "#111111"
                        : col.toLowerCase().includes("navy")
                          ? "#1b2a4a"
                          : col.toLowerCase().includes("olive")
                            ? "#556b2f"
                            : col.toLowerCase().includes("grey") ||
                                col.toLowerCase().includes("charcoal")
                              ? "#4a4a4a"
                              : "#c8b6a6",
                  }}
                />
              ))}
            </div>
          )}
          <span className="variant-label-sm">
            {colors.length > 0
              ? `${colors.length} ${colors.length === 1 ? "Color" : "Colors"}`
              : ""}
            {sizes.length > 0 ? ` · ${sizes.join(", ")}` : ""}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
