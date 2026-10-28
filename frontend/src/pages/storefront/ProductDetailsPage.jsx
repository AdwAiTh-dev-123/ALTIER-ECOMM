import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStorefrontProductById } from '../../api/shopApi';
import { ImageGalleryZoom } from '../../components/product/ImageGalleryZoom';
import { ProductCard } from '../../components/product/ProductCard';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToast, setAddedToast] = useState(false);

    // Fetch product details from backend
    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            setError('');
            try {
                const res = await getStorefrontProductById(id);
                const prodData = res.data?.data;
                if (!prodData) {
                    setError('Garment unavailable or deleted.');
                    return;
                }
                setProduct(prodData);

                // Select first available variant with stock
                const firstInStock = prodData.variants?.find((v) => v.stock > 0) || prodData.variants?.[0];
                setSelectedVariant(firstInStock || null);
            } catch (err) {
                setError(err.response?.data?.message || 'Garment could not be found.');
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) {
        return (
            <div className="product-details-loading">
                <div className="loading-spinner" />
                <p>Inspecting atelier piece...</p>
            </div>
        );
    }

    // Graceful error state for unavailable/deleted items
    if (error || !product) {
        return (
            <div className="product-unavailable-box">
                <span className="unavailable-icon">✦</span>
                <h2>Piece Unavailable</h2>
                <p>{error || 'This garment is currently unlisted or has been discontinued.'}</p>
                <Link to="/collections" className="btn btn-primary">
                    Return to All Collections &rarr;
                </Link>
            </div>
        );
    }

    const variants = product.variants || [];
    const uniqueColors = [...new Set(variants.map((v) => v.color))];

    // Filter sizes available for currently selected color
    const availableSizesForColor = variants
        .filter((v) => v.color === selectedVariant?.color)
        .map((v) => ({
            size: v.size,
            stock: v.stock,
            variantObj: v,
        }));

    const handleColorChange = (newColor) => {
        const match = variants.find((v) => v.color === newColor && v.size === selectedVariant?.size)
            || variants.find((v) => v.color === newColor);
        if (match) {
            setSelectedVariant(match);
            setQuantity(1);
        }
    };

    const handleSizeChange = (variantObj) => {
        setSelectedVariant(variantObj);
        setQuantity(1);
    };

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'admin') return;
        if (!selectedVariant || selectedVariant.stock <= 0) return;

        const success = addToCart(product, selectedVariant, quantity);
        if (success) {
            setAddedToast(true);
            setTimeout(() => setAddedToast(false), 3000);
        }
    };

    const handleWishlistClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'admin') return;
        toggleWishlist({
            ...product,
            price: Number(selectedVariant?.price || product.price || 0),
        });
    };

    const isSaved = isInWishlist(product._id);
    const currentStock = selectedVariant?.stock || 0;
    const isOutOfStock = currentStock <= 0;

    return (
        <div className="product-details-root">
            {/* 1. Breadcrumbs */}
            <nav className="breadcrumbs-nav">
                <Link to="/">Home</Link>
                <span className="crumb-sep">/</span>
                <Link to="/collections">Collections</Link>
                {product.category?.name && (
                    <>
                        <span className="crumb-sep">/</span>
                        <Link to={`/collections?category=${product.category._id}`}>
                            {product.category.name}
                        </Link>
                    </>
                )}
                <span className="crumb-sep">/</span>
                <span className="crumb-current">{product.name}</span>
            </nav>

            {/* 2. Main Product Interactive Area */}
            <div className="product-details-grid">
                {/* Left: Zoom Gallery */}
                <div className="product-details-visuals">
                    <ImageGalleryZoom
                        images={
                            selectedVariant?.images?.length > 0
                                ? selectedVariant.images
                                : product.images
                        }
                    />
                </div>

                {/* Right: Garment Information & Order Controls */}
                <div className="product-details-summary">
                    <div className="product-title-group">
                        <span className="product-category-tag">
                            {product.category?.name || 'Studio Collection'}
                        </span>
                        <h1 className="product-name">{product.name}</h1>
                        <div className="product-price-row">
                            <span className="product-current-price">
                                ₹{Number(selectedVariant?.price || product.price || 0).toLocaleString()}
                            </span>
                            <span className="product-tax-note">All taxes included. Free standard shipping.</span>
                        </div>
                    </div>

                    <p className="product-editorial-desc">
                        {product.description ||
                            'A minimal, comfortable wardrobe essential tailored with premium craftsmanship.'}
                    </p>

                    <hr className="details-divider" />

                    {/* Color Selection */}
                    {uniqueColors.length > 0 && (
                        <div className="variant-select-group">
                            <label className="variant-label">
                                Color: <strong>{selectedVariant?.color}</strong>
                            </label>
                            <div className="color-swatches-row">
                                {uniqueColors.map((col) => (
                                    <button
                                        key={col}
                                        type="button"
                                        className={`color-swatch-btn ${selectedVariant?.color === col ? 'active' : ''}`}
                                        onClick={() => handleColorChange(col)}
                                        title={col}
                                    >
                                        <span className="swatch-color-dot" data-color={col} />
                                        <span className="swatch-text">{col}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Selection */}
                    <div className="variant-select-group">
                        <div className="variant-label-row">
                            <label className="variant-label">
                                Size: <strong>{selectedVariant?.size || 'Select a size'}</strong>
                            </label>
                            <span className="size-guide-hint">True to size · Boxy fit</span>
                        </div>

                        <div className="size-pills-row">
                            {availableSizesForColor.map(({ size, stock, variantObj }) => {
                                const isSelected = selectedVariant?._id === variantObj._id;
                                const outOfStock = stock <= 0;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        disabled={outOfStock}
                                        className={`size-pill-btn ${isSelected ? 'active' : ''} ${outOfStock ? 'disabled' : ''}`}
                                        onClick={() => handleSizeChange(variantObj)}
                                    >
                                        {size}
                                        {outOfStock && <span className="size-strike" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stock Availability Indicator */}
                    <div className="stock-indicator-row">
                        {isOutOfStock ? (
                            <span className="stock-status-pill out">
                                ● Out of Stock in this variant
                            </span>
                        ) : currentStock <= 5 ? (
                            <span className="stock-status-pill low">
                                ● Only {currentStock} pieces remaining
                            </span>
                        ) : (
                            <span className="stock-status-pill available">
                                ● In Stock ({currentStock} units ready to ship)
                            </span>
                        )}
                        {selectedVariant?.sku && (
                            <span className="sku-tag">SKU: {selectedVariant.sku}</span>
                        )}
                    </div>

                    {/* Quantity and Actions */}
                    {user?.role === 'admin' ? (
                        <div style={{
                            padding: '1rem 1.25rem',
                            backgroundColor: '#f5f4f0',
                            border: '1px solid #e7e5e4',
                            borderRadius: '8px',
                            color: '#78716c',
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            marginTop: '1rem',
                        }}>
                            <strong style={{ color: '#1c1917', display: 'block', marginBottom: '0.25rem' }}>
                                Administrator View
                            </strong>
                            Shopping actions (shopping bag & wishlist) are reserved for customer accounts.
                        </div>
                    ) : (
                        <div className="product-actions-bar">
                            {/* Quantity Adjuster */}
                            <div className="quantity-adjuster">
                                <button
                                    type="button"
                                    disabled={quantity <= 1 || isOutOfStock}
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                >
                                    −
                                </button>
                                <span>{quantity}</span>
                                <button
                                    type="button"
                                    disabled={quantity >= currentStock || isOutOfStock}
                                    onClick={() => setQuantity((q) => q + 1)}
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Bag Button */}
                            <button
                                type="button"
                                className={`btn btn-primary add-to-bag-btn ${isOutOfStock ? 'disabled' : ''}`}
                                disabled={isOutOfStock}
                                onClick={handleAddToCart}
                            >
                                {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                            </button>

                            {/* Wishlist Button */}
                            <button
                                type="button"
                                className={`details-wishlist-btn ${isSaved ? 'is-saved' : ''}`}
                                onClick={handleWishlistClick}
                                title={isSaved ? 'Remove from saved' : 'Save to wishlist'}
                                aria-label="Wishlist toggle"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Toast Notification */}
                    {addedToast && (
                        <div className="product-added-toast">
                            ✓ Added {quantity} × {product.name} ({selectedVariant?.color}, {selectedVariant?.size}) to your bag.
                            <Link to="/cart" className="toast-link">View Bag &rarr;</Link>
                        </div>
                    )}

                    {/* Garment Highlights Accordion */}
                    <div className="garment-highlights-list">
                        <details className="highlight-item" open>
                            <summary>Materials & Fabric Details</summary>
                            <p>Crafted from 100% sustainably-sourced natural fibers. Pre-washed for a soft hand-feel that retains structure over washes.</p>
                        </details>
                        <details className="highlight-item">
                            <summary>Fit & Sizing</summary>
                            <p>Designed with a relaxed, modern drape. For a standard closer fit, take one size down from your usual preference.</p>
                        </details>
                        <details className="highlight-item">
                            <summary>Complimentary Shipping & Returns</summary>
                            <p>Dispatched within 24 hours. Complimentary returns or size exchanges within 14 days of delivery.</p>
                        </details>
                    </div>
                </div>
            </div>

            {/* 3. Related Products Section */}
            {product.relatedProducts?.length > 0 && (
                <section className="related-products-section">
                    <div className="section-header-compact">
                        <div>
                            <span className="section-eyebrow">COMPLETE THE WARDROBE</span>
                            <h2 className="section-title">Similar Silhouettes</h2>
                        </div>
                    </div>
                    <div className="products-grid">
                        {product.relatedProducts.map((rel) => (
                            <ProductCard key={rel._id} product={rel} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetailsPage;
