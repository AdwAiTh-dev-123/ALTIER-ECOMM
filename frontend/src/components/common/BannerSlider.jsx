import React, { useState, useEffect, useRef } from 'react';
import { useBanners } from '../../context/BannerContext';

export const BannerSlider = ({ onSelectCategory }) => {
  const { activeBanners } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const bannerCount = activeBanners.length;

  // Auto-scrolling horizontal timer (every 4.5 seconds)
  useEffect(() => {
    if (bannerCount <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % bannerCount);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bannerCount, isPaused]);

  if (!activeBanners || bannerCount === 0) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + bannerCount) % bannerCount);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % bannerCount);
  };

  const handleDotClick = (e, index) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleBannerClick = (category) => {
    if (onSelectCategory) {
      onSelectCategory(category || 'all');
    }
  };

  return (
    <div
      className="banner-slider-root"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Horizontal Slides Track */}
      <div
        className="banner-slides-track"
        data-slide={currentIndex}
      >
        {activeBanners.map((banner) => (
          <div
            key={banner._id}
            className="banner-slide-item"
            onClick={() => handleBannerClick(banner.category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBannerClick(banner.category);
            }}
          >
            {/* Background Image with Dark Vignette/Gradient */}
            <img
              src={banner.image}
              alt={banner.title}
              className="banner-slide-image"
            />
            <div className="banner-slide-overlay" />

            {/* Slide Content */}
            <div className="banner-slide-content">
              {banner.tag && (
                <span className="banner-slide-tag">
                  <span className="tag-pulse-dot" />
                  {banner.tag}
                </span>
              )}

              <h2 className="banner-slide-title">{banner.title}</h2>
              <p className="banner-slide-subtitle">{banner.subtitle}</p>

              {banner.buttonText && (
                <button
                  type="button"
                  className="btn btn-primary banner-cta-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick(banner.category);
                  }}
                >
                  {banner.buttonText} &rarr;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrow Controls */}
      {bannerCount > 1 && (
        <>
          <button
            type="button"
            className="slider-nav-arrow arrow-prev"
            onClick={handlePrev}
            title="Previous slide"
          >
            &#10094;
          </button>
          <button
            type="button"
            className="slider-nav-arrow arrow-next"
            onClick={handleNext}
            title="Next slide"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {bannerCount > 1 && (
        <div className="slider-dots-container">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`slider-dot-btn ${currentIndex === idx ? 'active' : ''}`}
              onClick={(e) => handleDotClick(e, idx)}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;
