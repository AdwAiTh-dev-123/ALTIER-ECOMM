import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "../../api/shopApi";
import { ProductCard } from "../../components/product/ProductCard";
import { BannerSlider } from "../../components/common/BannerSlider";
import "../../styles/storefront/HomePage.css";

export const HomePage = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          getStorefrontCategories(),
          getStorefrontProducts({ limit: 8, sortBy: "newest" }), // Fetch only 8 newest pieces
        ]);
        setCategories(categoriesRes.data?.data || []);
        setNewArrivals(productsRes.data?.data || []);
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleBannerCategorySelect = (categoryId) => {
    if (categoryId && categoryId !== "all") {
      navigate(`/collections?category=${categoryId}`);
    } else {
      navigate("/collections");
    }
  };

  return (
    <div className="home-page-root">
      {/* 1. Hero Banner Slider */}
      <section className="home-hero-section">
        <BannerSlider onSelectCategory={handleBannerCategorySelect} />
      </section>

      {/* 2. Brand Value Proposition Ribbon */}
      <section className="home-values-strip">
        <div className="value-pill">
          <span className="value-icon">✦</span>
          <div>
            <strong>Small-Batch Production</strong>
            <p>Consciously designed in limited runs</p>
          </div>
        </div>
        <div className="value-pill">
          <span className="value-icon">◈</span>
          <div>
            <strong>Natural Fibers Only</strong>
            <p>100% French linen & organic combed cotton</p>
          </div>
        </div>
        <div className="value-pill">
          <span className="value-icon">❖</span>
          <div>
            <strong>Complimentary Express Shipping</strong>
            <p>Free pan-India delivery on orders above ₹1,500</p>
          </div>
        </div>
      </section>

      {/* 3. Sleek Scrollable Categories Explorer */}
      {categories.length > 0 && (
        <section className="home-section home-categories-section">
          <div className="section-header-compact">
            <div>
              <span className="section-eyebrow">CURATED SILHOUETTES</span>
              <h2 className="section-title">Explore by Category</h2>
            </div>
            <Link to="/collections" className="section-link-action">
              View All ({categories.length}) &rarr;
            </Link>
          </div>

          <div className="home-categories-scroll-track">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/collections?category=${cat._id}`}
                className="home-category-card"
              >
                <div className="category-card-badge">Collection</div>
                <h3 className="category-card-name">{cat.name}</h3>
                <p className="category-card-desc">
                  {cat.description || "Minimalist everyday essentials"}
                </p>
                <span className="category-card-arrow">Explore &rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. New Arrivals (Small curated count: 8 items) */}
      <section className="home-section home-new-arrivals-section">
        <div className="section-header-compact">
          <div>
            <span className="section-eyebrow">JUST RELEASED</span>
            <h2 className="section-title">New Arrivals</h2>
            <p className="section-subtitle">
              The latest additions to our permanent and seasonal collections.
            </p>
          </div>
          <Link to="/collections" className="btn btn-secondary btn-sm">
            Explore All Collections &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="home-loading-box">
            <p>Loading latest arrivals...</p>
          </div>
        ) : newArrivals.length > 0 ? (
          <>
            <div className="products-grid">
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <div className="home-cta-center">
              <Link
                to="/collections"
                className="btn btn-primary btn-lg home-view-all-btn"
              >
                Browse Full Catalog &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-results-box">
            <p>No new products available right now. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
