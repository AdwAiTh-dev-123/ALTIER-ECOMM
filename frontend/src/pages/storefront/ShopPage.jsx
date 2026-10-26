import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStorefrontCategories, getStorefrontProducts } from '../../api/shopApi';
import { ProductCard } from '../../components/product/ProductCard';
import Pagination from '../../components/common/Pagination';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Categories & Products state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Query States
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  });

  const scrollRibbonRef = useRef(null);

  // Sync state if URL searchParams changes externally (e.g. from Home page links)
  useEffect(() => {
    const catFromUrl = searchParams.get('category') || 'all';
    setSelectedCategory(catFromUrl);
  }, [searchParams]);

  // 1. Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getStorefrontCategories();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
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

  // 4. Fetch all products from backend whenever filters or page change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sortBy,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (debouncedMinPrice !== '') params.minPrice = debouncedMinPrice;
      if (debouncedMaxPrice !== '') params.maxPrice = debouncedMaxPrice;

      const res = await getStorefrontProducts(params);
      setProducts(res.data.data || []);

      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, debouncedSearch, selectedCategory, debouncedMinPrice, debouncedMaxPrice]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Category select handler (used by both the scrollable ribbon and the dropdown)
  const handleCategorySelect = (catId) => {
    setCurrentPage(1);
    setSelectedCategory(catId);

    const nextParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catId);
    }
    setSearchParams(nextParams);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setMinPrice('');
    setDebouncedMinPrice('');
    setMaxPrice('');
    setDebouncedMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
    setSelectedCategory('all');

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    setSearchParams(nextParams);
  };


  // Scroll ribbon helper
  const handleRibbonScroll = (direction) => {
    if (scrollRibbonRef.current) {
      const scrollOffset = direction === 'left' ? -250 : 250;
      scrollRibbonRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Find active category name for header
  const activeCategoryObj = categories.find((c) => c._id === selectedCategory);
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : 'All Collections';

  return (
    <div className="shop-page-root" id="collections-top">
      {/* Editorial Header */}
      <div className="collections-editorial-header">
        <span className="editorial-eyebrow">THE ARCHIVE</span>
        <h1 className="editorial-title">{pageTitle}</h1>
        <p className="editorial-subtitle">
          {activeCategoryObj?.description ||
            'Explore our full catalog of thoughtfully designed, ethical wardrobe essentials.'}
        </p>
      </div>

      {/* Sleek Horizontal Scrollable Category Ribbon (Never wraps, even with 50+ categories) */}
      {categories.length > 0 && (
        <div className="category-ribbon-wrapper">
          <button
            type="button"
            className="ribbon-arrow-btn ribbon-arrow-left"
            onClick={() => handleRibbonScroll('left')}
            aria-label="Scroll categories left"
          >
            ‹
          </button>

          <div className="category-scroll-ribbon" ref={scrollRibbonRef}>
            <button
              type="button"
              className={`ribbon-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('all')}
            >
              All Garments
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`ribbon-pill ${selectedCategory === cat._id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat._id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ribbon-arrow-btn ribbon-arrow-right"
            onClick={() => handleRibbonScroll('right')}
            aria-label="Scroll categories right"
          >
            ›
          </button>
        </div>
      )}

      <div className="shop-layout">
        {/* Compact, Perfectly Aligned Filter Controls Bar */}
        <aside className="shop-filter-bar">
          {/* Search Box */}
          <div className="filter-group filter-search">
            <label className="filter-label" htmlFor="search-input">Search Collection</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search by title or fabric..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Compact Category Dropdown (Clean and resilient for large numbers of categories) */}
          <div className="filter-group" style={{ minWidth: '160px' }}>
            <label className="filter-label" htmlFor="category-select">Category</label>
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
          <div className="filter-group" style={{ minWidth: '170px' }}>
            <span className="filter-label">Price (₹)</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                className="input-field"
                style={{ width: '75px', padding: '6px 8px' }}
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="number"
                placeholder="Max"
                className="input-field"
                style={{ width: '75px', padding: '6px 8px' }}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-group" style={{ minWidth: '150px' }}>
            <label className="filter-label" htmlFor="sort-select">Sort By</label>
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

          {/* Clear Button */}
          <div className="filter-group filter-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </aside>

        {/* Product Catalog Results */}
        <main className="shop-grid-container">
          <div className="shop-results-header">
            <span className="results-count">
              {loading ? (
                'Loading collection...'
              ) : (
                `Showing ${products.length} of ${pagination.totalItems} ${pagination.totalItems === 1 ? 'item' : 'items'}`
              )}
            </span>
          </div>

          {error && (
            <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Fetching collection...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Backend Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ marginTop: '36px' }}>
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    limit={pagination.limit}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      const el = document.getElementById('collections-top');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
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
