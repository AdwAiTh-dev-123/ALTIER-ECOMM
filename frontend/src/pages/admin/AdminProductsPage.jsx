import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminProducts,
  getAdminCategories,
  toggleProductStatus,
  deleteAdminProduct,
} from "../../api/adminApi";
import AddProductModal from "../../components/admin/AdminProductModal";
import Pagination from "../../components/common/Pagination";
import "../../styles/admins/AdminProductsPage.css";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Filter & Sorting States
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // In-DOM Dropdowns state ('category' | 'stock' | 'sort' | null)
  const [openDropdown, setOpenDropdown] = useState(null);
  const controlsRightRef = useRef(null);

  // Close open dropdown when tapping/clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        controlsRightRef.current &&
        !controlsRightRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const SORT_OPTIONS = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "name-asc", label: "Name (A – Z)" },
    { value: "name-desc", label: "Name (Z – A)" },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === `${sortBy}-${sortOrder}`)?.label ||
    "Newest First";

  const currentCategoryLabel =
    category === "all"
      ? "All Categories"
      : categories.find((c) => c._id === category)?.name || "All Categories";

  const STOCK_OPTIONS = [
    { value: "all", label: "All Stock" },
    { value: "inStock", label: "In Stock" },
    { value: "outOfStock", label: "Out of Stock" },
  ];

  const currentStockLabel =
    STOCK_OPTIONS.find((s) => s.value === stock)?.label || "All Stock";

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Fetch categories for category filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getAdminCategories({ limit: 100 });
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Failed to load categories for filter:", err);
      }
    }
    loadCategories();
  }, []);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
  });

  // Confirmation modal state for listing/unlisting
  const [toggleModal, setToggleModal] = useState({
    isOpen: false,
    product: null,
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load products from backend with filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = {
        search: debouncedSearch,
        category,
        status,
        stock,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      };
      const res = await getAdminProducts(params);
      setProducts(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    category,
    status,
    stock,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("all");
    setStatus("all");
    setStock("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "all" ||
    status !== "all" ||
    stock !== "all" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  // Confirm toggle Listed/Unlisted status
  const handleConfirmToggle = async () => {
    const target = toggleModal.product;
    if (!target) return;

    setToggleModal({ isOpen: false, product: null });
    setActionLoadingId(target._id);
    setErrorMessage("");
    try {
      const res = await toggleProductStatus(target._id);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === target._id ? { ...p, isListed: !p.isListed } : p,
        ),
      );
      setSuccessToast(
        res.data?.message ||
          `Product successfully ${target.isListed ? "unlisted" : "published"}`,
      );
      setTimeout(() => setSuccessToast(""), 3000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to toggle product status",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm delete product
  const handleConfirmDelete = async () => {
    const target = deleteModal.product;
    if (!target) return;

    setDeleteModal({ isOpen: false, product: null });
    setActionLoadingId(target._id);
    setErrorMessage("");

    try {
      const res = await deleteAdminProduct(target._id);
      // Remove from table immediately
      setProducts((prev) => prev.filter((p) => p._id !== target._id));
      setPagination((prev) => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
      }));
      setSuccessToast(res.data.message || "Product deleted successfully");
      setTimeout(() => setSuccessToast(""), 3000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to delete product",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-page-title">Products Management</h1>
            <p className="admin-page-subtitle">
              View, add, and organize your apparel inventory and variants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="admin-btn-primary"
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successToast && (
        <div className="admin-alert-banner alert-success">{successToast}</div>
      )}
      {errorMessage && (
        <div className="admin-alert-banner alert-danger">{errorMessage}</div>
      )}

      {/* Search & Filter Controls Bar */}
      <div className="admin-controls-bar">
        {/* Search Input */}
        <div className="admin-search-wrap">
          <svg
            className="admin-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search products by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Controls Group: Category, Stock, Sort, Status */}
        <div className="admin-controls-right" ref={controlsRightRef}>
          {/* Custom Category Dropdown */}
          <div className="admin-sort-wrap">
            <button
              type="button"
              className="admin-custom-dropdown-btn"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === "category" ? null : "category",
                )
              }
              aria-expanded={openDropdown === "category"}
            >
              <span className="admin-dropdown-btn-text">
                Category: <strong>{currentCategoryLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openDropdown === "category" ? "open" : ""}`}
              >
                ▾
              </span>
            </button>

            {openDropdown === "category" && (
              <div className="admin-custom-dropdown-menu">
                <button
                  type="button"
                  className={`admin-dropdown-item ${category === "all" ? "selected" : ""}`}
                  onClick={() => {
                    setCategory("all");
                    setCurrentPage(1);
                    setOpenDropdown(null);
                  }}
                >
                  <span>All Categories</span>
                  {category === "all" && (
                    <span className="dropdown-check">✓</span>
                  )}
                </button>
                {categories.map((c) => {
                  const isSelected = category === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      className={`admin-dropdown-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setCategory(c._id);
                        setCurrentPage(1);
                        setOpenDropdown(null);
                      }}
                    >
                      <span>{c.name}</span>
                      {isSelected && (
                        <span className="dropdown-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Stock Dropdown */}
          <div className="admin-sort-wrap">
            <button
              type="button"
              className="admin-custom-dropdown-btn"
              onClick={() =>
                setOpenDropdown((prev) => (prev === "stock" ? null : "stock"))
              }
              aria-expanded={openDropdown === "stock"}
            >
              <span className="admin-dropdown-btn-text">
                Stock: <strong>{currentStockLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openDropdown === "stock" ? "open" : ""}`}
              >
                ▾
              </span>
            </button>

            {openDropdown === "stock" && (
              <div className="admin-custom-dropdown-menu">
                {STOCK_OPTIONS.map((opt) => {
                  const isSelected = stock === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`admin-dropdown-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setStock(opt.value);
                        setCurrentPage(1);
                        setOpenDropdown(null);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <span className="dropdown-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Sort Dropdown */}
          <div className="admin-sort-wrap">
            <button
              type="button"
              className="admin-custom-dropdown-btn"
              onClick={() =>
                setOpenDropdown((prev) => (prev === "sort" ? null : "sort"))
              }
              aria-expanded={openDropdown === "sort"}
            >
              <span className="admin-dropdown-btn-text">
                Sort: <strong>{currentSortLabel}</strong>
              </span>
              <span
                className={`admin-dropdown-chevron ${openDropdown === "sort" ? "open" : ""}`}
              >
                ▾
              </span>
            </button>

            {openDropdown === "sort" && (
              <div className="admin-custom-dropdown-menu">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = `${sortBy}-${sortOrder}` === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`admin-dropdown-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const [newField, newOrder] = opt.value.split("-");
                        setSortBy(newField);
                        setSortOrder(newOrder);
                        setCurrentPage(1);
                        setOpenDropdown(null);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <span className="dropdown-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Tabs (All, Listed, Unlisted) */}
          <div className="admin-filter-tabs">
            {[
              { id: "all", label: "All" },
              { id: "listed", label: "Listed" },
              { id: "unlisted", label: "Unlisted" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-filter-tab ${status === tab.id ? "active" : ""}`}
                onClick={() => {
                  setStatus(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="admin-btn-clear-filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="admin-panel-card">
        {/* Scrollable Container with sticky header */}
        <div className="admin-table-responsive">
          <table
            className={`admin-table ${products.length === 0 ? "admin-table-empty" : ""}`}
          >
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Variants Count</th>
                <th>Total Stock</th>
                <th>Sizes & Colors</th>
                <th>Status</th>
                <th style={{ textAlign: "right", width: "230px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#78716c",
                    }}
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-cell">
                    <div className="admin-empty-wrapper">
                      <div className="admin-empty-icon-circle">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className="admin-empty-text-wrap">
                        <h3 className="admin-empty-heading">
                          {hasActiveFilters
                            ? "No matching products found"
                            : "No products found in your catalog"}
                        </h3>
                        <p className="admin-empty-description">
                          {hasActiveFilters
                            ? "Try adjusting your search query or filters to find what you're looking for."
                            : "Get started by adding your first product with color and size variants."}
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="admin-empty-action-btn btn-clear-empty"
                        >
                          Clear All Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="admin-btn-primary admin-empty-action-btn"
                        >
                          <span>+</span> Add First Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const variants = product.variants || [];
                  const firstImage = variants.find((v) => v.images?.length > 0)
                    ?.images[0];
                  const uniqueColors = [
                    ...new Set(variants.map((v) => v.color)),
                  ];
                  const uniqueSizes = [...new Set(variants.map((v) => v.size))];
                  const isActionLoading = actionLoadingId === product._id;

                  const totalStock = variants.reduce(
                    (sum, v) => sum + (v.stock || 0),
                    0,
                  );

                  return (
                    <tr
                      key={product._id}
                      className={!product.isListed ? "row-blocked" : ""}
                    >
                      {/* Thumbnail & Title */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div className="admin-prod-thumb">
                            {firstImage ? (
                              <img src={firstImage} alt={product.name} />
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100%",
                                  fontSize: "10px",
                                  color: "#78716c",
                                }}
                              >
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <strong
                              style={{ fontSize: "0.92rem", color: "#1c1917" }}
                            >
                              {product.name}
                            </strong>
                            <div
                              style={{ fontSize: "0.75rem", color: "#78716c" }}
                            >
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="admin-status-badge status-active">
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Variants Count */}
                      <td>
                        <strong>{variants.length}</strong> variant
                        {variants.length !== 1 ? "s" : ""}
                      </td>

                      {/* ✅ Insert Total Stock Column */}
                      <td>
                        <span
                          className={`admin-status-badge ${
                            totalStock === 0
                              ? "status-blocked"
                              : "status-active"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {totalStock === 0
                            ? "Out of Stock"
                            : `${totalStock} in stock`}
                        </span>
                      </td>

                      {/* Colors & Sizes summary */}
                      <td>
                        <div style={{ fontSize: "0.82rem" }}>
                          <div>🎨 {uniqueColors.join(", ") || "None"}</div>
                          <div style={{ color: "#78716c" }}>
                            📏 {uniqueSizes.join(", ") || "None"}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`admin-status-badge ${
                            product.isListed
                              ? "status-active"
                              : "status-blocked"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {product.isListed ? "Listed" : "Unlisted"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="admin-actions-cell text-right">
                        <div className="admin-actions-group">
                          {/* List/Unlist Button */}
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              setToggleModal({ isOpen: true, product })
                            }
                            className={`admin-action-btn btn-toggle ${
                              product.isListed ? "btn-block" : "btn-unblock"
                            }`}
                          >
                            {isActionLoading
                              ? "Updating..."
                              : product.isListed
                                ? "Unlist"
                                : "List"}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="admin-action-btn btn-edit"
                          >
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              setDeleteModal({ isOpen: true, product })
                            }
                            className="admin-action-btn btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Identical Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit || 10}
          onPageChange={(page) => setCurrentPage(page)}
          loading={loading}
        />
      </div>

      {/* Listing / Unlisting Confirmation Modal */}
      {toggleModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">
              {toggleModal.product?.isListed
                ? "Unlist Product"
                : "Publish Product to Storefront"}
            </h3>
            <p className="admin-modal-message">
              Are you sure you want to{" "}
              {toggleModal.product?.isListed ? "hide" : "publish"}{" "}
              <strong>{toggleModal.product?.name}</strong>?
              {toggleModal.product?.isListed && (
                <span className="admin-modal-warning">
                  {" "}
                  This product and all its variants will no longer appear or be
                  purchasable by customers in the storefront catalog.
                </span>
              )}
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setToggleModal({ isOpen: false, product: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-modal-confirm-btn ${
                  toggleModal.product?.isListed
                    ? "btn-confirm-block"
                    : "btn-confirm-unblock"
                }`}
                onClick={handleConfirmToggle}
              >
                Yes,{" "}
                {toggleModal.product?.isListed
                  ? "Unlist Product"
                  : "Publish Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Delete Product</h3>
            <p className="admin-modal-message">
              Are you sure you want to delete{" "}
              <strong>{deleteModal.product?.name}</strong>?
              <span className="admin-modal-warning">
                {" "}
                This will permanently remove the product and all associated
                size/color variants.
              </span>
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, product: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm-btn btn-confirm-block"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        productToEdit={editingProduct}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          loadProducts();
          setSuccessToast(
            editingProduct
              ? "Product updated successfully"
              : "Product created successfully",
          );
          setTimeout(() => setSuccessToast(""), 3000);
        }}
      />
    </div>
  );
};

export default AdminProductsPage;
