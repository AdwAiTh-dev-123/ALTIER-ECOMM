import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { ProductCard } from '../../components/product/ProductCard';
import { BannerSlider } from '../../components/common/BannerSlider';

export const ShopPage = () => {
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || 'all';
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // Default descending order
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique colors and sizes across the entire catalog for filters
  const allColors = useMemo(() => {
    const set = new Set();
    products.forEach(p => p.variants.forEach(v => set.add(v.color)));
    return ['all', ...Array.from(set)];
  }, [products]);

  const allSizes = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        // Color variant filter
        if (selectedColor !== 'all') {
          const hasColor = product.variants.some(v => v.color === selectedColor);
          if (!hasColor) return false;
        }
        // Size variant filter
        if (selectedSize !== 'all') {
          const hasSize = product.variants.some(v => v.size === selectedSize);
          if (!hasSize) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
        if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
        // Default: newest first (descending date)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [products, selectedCategory, selectedColor, selectedSize, sortBy, searchQuery]);

  const handleCategorySelect = (catId) => {
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleBannerCategorySelect = (catId) => {
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);

    // Smooth scroll to catalog section
    setTimeout(() => {
      const catalogEl = document.getElementById('shop-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleClearFilters = () => {
    setSelectedColor('all');
    setSelectedSize('all');
    setSearchQuery('');
    setSortBy('newest');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  return (
    <div className="shop-page-root">
      {/* Auto-scrolling Hero Banner Carousel */}
      <BannerSlider onSelectCategory={handleBannerCategorySelect} />

      <div className="shop-layout" id="shop-catalog-section">
        {/* Filter Controls Bar */}
        <aside className="shop-filter-bar">
          {/* Search Box */}
          <div className="filter-group filter-search">
            <label className="filter-label" htmlFor="search-input">Search</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search garments..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="filter-group">
            <span className="filter-label">Category</span>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategorySelect('all')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  type="button"
                  className={`filter-pill ${selectedCategory === cat._id ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat._id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Variant Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="color-select">Color</label>
            <select
              id="color-select"
              className="select-field"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              {allColors.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Colors' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Size Variant Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="size-select">Size</label>
            <select
              id="size-select"
              className="select-field"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {allSizes.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Sizes' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown (Defaults descending) */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="sort-select">Sort By</label>
            <select
              id="sort-select"
              className="select-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Arrivals (Default)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="filter-group filter-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
            >
              Reset
            </button>
          </div>
        </aside>

        {/* Products Results Grid */}
        <main className="shop-grid-container">
          <div className="shop-results-header">
            <span className="results-count">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-results-box">
              <h3>No items match your selected filters</h3>
              <p>Try resetting your color or size filters to view more products.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;
