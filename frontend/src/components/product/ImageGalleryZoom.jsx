import React, { useState, useRef } from 'react';

export const ImageGalleryZoom = ({ images = [] }) => {
    const displayImages = images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'];

    const [activeIndex, setActiveIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const imageRef = useRef(null);

    const activeImage = displayImages[activeIndex] || displayImages[0];

    // Direct GPU transform-origin update without triggering React re-renders
    const handleMouseMove = (e) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        imageRef.current.style.transformOrigin = `${x}% ${y}%`;
    };

    const handleMouseEnter = () => setIsZoomed(true);
    const handleMouseLeave = () => {
        setIsZoomed(false);
        if (imageRef.current) {
            imageRef.current.style.transformOrigin = 'center center';
        }
    };

    return (
        <div className="product-gallery-root">
            {/* Thumbnail Strip */}
            {displayImages.length > 1 && (
                <div className="gallery-thumbnail-strip">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`gallery-thumb-btn ${activeIndex === idx ? 'active' : ''}`}
                            onClick={() => setActiveIndex(idx)}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <img src={img} alt={`View ${idx + 1}`} />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image Viewport with GPU Scale Zoom */}
            <div
                className="gallery-main-viewport"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            >
                <img
                    ref={imageRef}
                    src={activeImage}
                    alt="Product display"
                    className="gallery-main-image"
                    style={{
                        transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                        transition: isZoomed ? 'transform 0.15s ease-out' : 'transform 0.25s ease-out, transform-origin 0.25s ease',
                        cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                        willChange: 'transform, transform-origin',
                    }}
                />

                <span className="gallery-zoom-hint">
                    {isZoomed ? 'Inspecting 2.2x' : 'Hover to Inspect'}
                </span>
            </div>
        </div>
    );
};

export default ImageGalleryZoom;
