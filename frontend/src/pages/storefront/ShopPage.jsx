import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "../../api/shopApi";
import { ProductCard } from "../../components/product/ProductCard";
import "../../styles/storefront/ShopPage.css";

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Categories & Products state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Filter & Query States
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination & Infinite Scroll States
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Sentinel ref for the IntersectionObserver
  const sentinelRef = useRef(null);

  // Sync state if URL searchParams change
  useEffect(() => {
    const catFromUrl = searchParams.get("category") || "all";
    setSelectedCategory(catFromUrl);
  }, [searchParams]);

  // 1. Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getStorefrontCategories();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // 2. Debounce search query input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Debounce price filter inputs (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  // 4. Fetch products (Page 1 resets list; Page > 1 appends to list)
  const fetchProducts = useCallback(
    async (pageToFetch) => {
      if (pageToFetch === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError("");

      try {
        const params = {
          page: pageToFetch,
          limit: 12,
          sortBy,
        };

        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (selectedCategory !== "all") params.category = selectedCategory;
        if (debouncedMinPrice !== "") params.minPrice = debouncedMinPrice;
        if (debouncedMaxPrice !== "") params.maxPrice = debouncedMaxPrice;

        const res = await getStorefrontProducts(params);
        const newItems = res.data.data || [];
        const paginationData = res.data.pagination || {};

        setTotalItems(paginationData.totalItems || 0);
        setHasMore(
          paginationData.hasMore ?? pageToFetch < paginationData.totalPages,
        );

        setProducts((prev) =>
          pageToFetch === 1 ? newItems : [...prev, ...newItems],
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch products");
        if (pageToFetch === 1) setProducts([]);
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      sortBy,
      debouncedSearch,
      selectedCategory,
      debouncedMinPrice,
      debouncedMaxPrice,
    ],
  );

  // Trigger fetch when filters or page change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  // 5. IntersectionObserver: Watch sentinel and load next page when scrolled into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        // If sentinel is visible, more pages exist, and we're not already loading
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !isInitialLoading &&
          !isLoadingMore
        ) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      },
      {
        root: null, // viewport
        rootMargin: "200px", // Pre-fetch 200px before user actually hits the absolute bottom!
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, isInitialLoading, isLoadingMore]);

  // Category select handler
  const handleCategorySelect = (catId) => {
    setCurrentPage(1);
    setSelectedCategory(catId);

    const nextParams = new URLSearchParams(searchParams);
    if (catId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", catId);
    }
    setSearchParams(nextParams);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setMinPrice("");
    setDebouncedMinPrice("");
    setMaxPrice("");
    setDebouncedMaxPrice("");
    setSortBy("newest");
    setCurrentPage(1);
    setSelectedCategory("all");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    setSearchParams(nextParams);
  };

  const activeCategoryObj = categories.find((c) => c._id === selectedCategory);
  const pageTitle = activeCategoryObj
    ? activeCategoryObj.name
    : "All Collections";

  return (
    <div className="shop-page-root" id="collections-top">
      {/* Editorial Header */}
      <div className="collections-editorial-header">
        <span className="editorial-eyebrow">THE ARCHIVE</span>
        <h1 className="editorial-title">{pageTitle}</h1>
        <p className="editorial-subtitle">
          {activeCategoryObj?.description ||
            "Explore our full catalog of thoughtfully designed, ethical wardrobe essentials."}
        </p>
      </div>

      <div className="shop-layout">
        <div className="mobile-filter-bar-toggle">
          <button
            type="button"
            className="btn-toggle-filters"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <span>
              ⚙️ {showMobileFilters ? "Hide Filters" : "Filters & Sort"}
            </span>
            {(selectedCategory !== "all" ||
              minPrice ||
              maxPrice ||
              searchQuery) && (
              <span className="active-filter-indicator">● Active</span>
            )}
          </button>
          <span className="mobile-results-count">
            {isInitialLoading ? "..." : `${products.length} garments`}
          </span>
        </div>
        {/* LEFT COLUMN: Sticky Filter Sidebar */}
        <aside className={`shop-filter-bar ${showMobileFilters ? "open" : ""}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "0.04em",
              }}
            >
              FILTERS
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              Reset All
            </button>
          </div>

          {/* Search Box */}
          <div className="filter-group filter-search">
            <label className="filter-label" htmlFor="search-input">
              Search
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Search garments..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="category-select">
              Category
            </label>
            <select
              id="category-select"
              className="select-field"
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter Inputs */}
          <div className="filter-group">
            <span className="filter-label">Price Range (₹)</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="input-field"
                style={{ width: "100%", padding: "6px 8px" }}
                value={minPrice}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setMinPrice(val === "" ? "" : Math.max(0, Number(val)));
                  setCurrentPage(1);
                }}
              />
              <span style={{ color: "var(--text-muted)" }}>–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="input-field"
                style={{ width: "100%", padding: "6px 8px" }}
                value={maxPrice}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaxPrice(val === "" ? "" : Math.max(0, Number(val)));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="sort-select">
              Sort By
            </label>
            <select
              id="sort-select"
              className="select-field"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
          {/* Mobile Apply / View Results Button */}
          <button
            type="button"
            className="mobile-apply-btn"
            onClick={() => setShowMobileFilters(false)}
          >
            View {products.length} Garments →
          </button>
        </aside>

        {/* RIGHT COLUMN: Product Catalog Results */}
        <main className="shop-grid-container">
          <div className="shop-results-header">
            <span className="results-count">
              {isInitialLoading
                ? "Loading collection..."
                : `Showing ${products.length} of ${totalItems} ${totalItems === 1 ? "garment" : "garments"}`}
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: "16px",
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {isInitialLoading ? (
            <div
              style={{
                padding: "4rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div className="infinite-spinner" />
              <p>Fetching collection...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Invisible sentinel element observed by IntersectionObserver */}
              <div ref={sentinelRef} style={{ height: "20px" }} />

              {/* Infinite Scroll Footer Feedback */}
              <div className="infinite-scroll-status">
                {isLoadingMore && (
                  <div>
                    <div className="infinite-spinner" />
                    <p>Loading more garments...</p>
                  </div>
                )}
                {!hasMore && products.length > 0 && (
                  <p
                    style={{
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontSize: "0.8rem",
                    }}
                  >
                    ✦ You have reached the end of the collection
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-results-box">
              <h3>No garments found</h3>
              <p>Try modifying your search or clearing price filters.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;
