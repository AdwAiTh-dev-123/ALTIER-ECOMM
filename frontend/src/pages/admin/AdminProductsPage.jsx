import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminProducts,
  toggleProductStatus,
  deleteProduct as deleteAdminProduct,
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
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

  // Load products from backend
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await getAdminProducts({
        search: debouncedSearch,
        page: currentPage,
        limit: 10,
      });
      setProducts(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Toggle Listed/Unlisted status
  const handleToggleListing = async (productId) => {
    setActionLoadingId(productId);
    setErrorMessage("");
    try {
      const res = await toggleProductStatus(productId);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isListed: !p.isListed } : p,
        ),
      );
      setSuccessToast(res.data.message || "Product status updated");
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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

      {/* Search Bar */}
      <div className="admin-controls-bar">
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
      </div>

      {/* Products Table Card */}
      <div className="admin-panel-card">
        {/* Scrollable Container with sticky header */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Variants Count</th>
                <th>Sizes & Colors</th>
                <th>Status</th>
                <th style={{ textAlign: "right", width: "230px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
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
                  <td colSpan="6" style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          backgroundColor: "var(--bg-muted, #f5f4f0)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted, #78716c)",
                        }}
                      >
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
                      <div>
                        <h3
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: "600",
                            color: "var(--text-primary, #1c1917)",
                            margin: "0 0 4px",
                          }}
                        >
                          No products found in your catalog
                        </h3>
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted, #78716c)",
                            margin: 0,
                          }}
                        >
                          {search
                            ? "Try adjusting your search query."
                            : "Get started by adding your first product with color and size variants."}
                        </p>
                      </div>
                      {!search && (
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="admin-btn-primary"
                          style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}
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

                      {/* Actions: Matching Category/User styling */}
                      <td
                        style={{
                          textAlign: "right",
                          width: "230px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "0.5rem",
                          }}
                        >
                          {/* List/Unlist Button */}
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleToggleListing(product._id)}
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
                            className="admin-action-btn admin-btn-secondary"
                            style={{
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.8rem",
                            }}
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
              : "Product created successfully"
          );
          setTimeout(() => setSuccessToast(""), 3000);
        }}
      />
    </div>
  );
};

export default AdminProductsPage;
