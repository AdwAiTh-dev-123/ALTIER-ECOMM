import React, { useState, useEffect } from "react";
import { getAdminCategories, createAdminProduct } from "../../api/adminApi";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const AVAILABLE_COLORS = [
  "Black",
  "White",
  "Charcoal",
  "Heather Grey",
  "Navy",
  "Olive",
  "Natural Sand",
  "Burgundy",
  "Terracotta",
];

const createEmptyVariant = () => ({
  id: Date.now() + Math.random(),
  size: "M",
  color: "Black",
  price: "",
  stock: "",
  images: [], // array of base64 preview strings
});

const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Product Core State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  // Variants State
  const [variants, setVariants] = useState([createEmptyVariant()]);

  // Fetch active categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await getAdminCategories({ limit: 100, status: "active" });
      const list = res.data.data || [];
      setCategories(list);
      if (list.length > 0) setCategoryId(list[0]._id);
    } catch (err) {
      setError("Failed to load categories for dropdown.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Add a new variant block
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  };

  // Remove a variant block
  const handleRemoveVariant = (idToRemove) => {
    if (variants.length <= 1) {
      setError("Product must have at least one variant.");
      return;
    }
    setError("");
    setVariants((prev) => prev.filter((v) => v.id !== idToRemove));
  };

  // Update a field inside a specific variant
  const handleVariantFieldChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  // Handle uploading multiple image files per variant (converts to base64 for instant preview)
  const handleVariantImageUpload = (id, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setVariants((prev) =>
          prev.map((v) => {
            if (v.id === id) {
              return { ...v, images: [...v.images, reader.result] };
            }
            return v;
          }),
        );
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a single photo from a variant
  const handleRemoveImage = (variantId, imgIndex) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            images: v.images.filter((_, idx) => idx !== imgIndex),
          };
        }
        return v;
      }),
    );
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setError("");
    setVariants([createEmptyVariant()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }
    if (!categoryId) {
      setError("Please select a valid category.");
      return;
    }

    // Validate variant inputs
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.price || Number(v.price) < 0) {
        setError(`Variant #${i + 1} requires a valid positive price.`);
        return;
      }
      if (v.stock === "" || Number(v.stock) < 0) {
        setError(`Variant #${i + 1} requires a valid stock count.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createAdminProduct({
        name,
        categoryId,
        description,
        variants,
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop">
      <div
        className="admin-modal-box"
        style={{
          maxWidth: "800px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #e7e5e4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="admin-modal-title" style={{ margin: 0 }}>
              Add New Product
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.82rem",
                color: "#78716c",
              }}
            >
              Define base details and configure unique size/color variants.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#78716c",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flex: 1,
          }}
        >
          <div
            style={{
              padding: "1.5rem 1.75rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {error && (
              <div className="admin-alert-banner alert-danger">{error}</div>
            )}

            {/* BASE PRODUCT DETAILS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div
                className="admin-form-group"
                style={{ gridColumn: "span 2" }}
              >
                <label className="admin-form-label">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heavyweight Organic Tee"
                  className="admin-search-input"
                  style={{ width: "100%", paddingLeft: "0.85rem" }}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="admin-select"
                  style={{ width: "100%" }}
                  disabled={categoriesLoading}
                >
                  {categories.length === 0 ? (
                    <option value="">No active categories available</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div
                className="admin-form-group"
                style={{ gridColumn: "span 2" }}
              >
                <label className="admin-form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material composition, garment fit, and care instructions..."
                  rows={3}
                  className="admin-search-input"
                  style={{
                    width: "100%",
                    paddingLeft: "0.85rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* VARIANTS SECTION */}
            <div
              style={{ borderTop: "1px solid #e7e5e4", paddingTop: "1.25rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <h3
                    style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}
                  >
                    Product Variants
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#78716c" }}>
                    Each variant holds separate color, size, stock, and photos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="admin-btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                >
                  + Add Variant
                </button>
              </div>

              {/* Dynamic Variant List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {variants.map((v, index) => (
                  <div
                    key={v.id}
                    style={{
                      border: "1px solid #e7e5e4",
                      borderRadius: "8px",
                      padding: "1rem",
                      backgroundColor: "#fafaf9",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.85rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          color: "#1c1917",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Variant #{index + 1}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            fontWeight: "500",
                          }}
                        >
                          🗑 Delete Variant
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "0.75rem",
                        marginBottom: "0.85rem",
                      }}
                    >
                      {/* Color Dropdown */}
                      <div>
                        <label className="admin-form-label">Colour</label>
                        <select
                          value={v.color}
                          onChange={(e) =>
                            handleVariantFieldChange(
                              v.id,
                              "color",
                              e.target.value,
                            )
                          }
                          className="admin-select"
                          style={{ width: "100%" }}
                        >
                          {AVAILABLE_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size Dropdown */}
                      <div>
                        <label className="admin-form-label">Size</label>
                        <select
                          value={v.size}
                          onChange={(e) =>
                            handleVariantFieldChange(
                              v.id,
                              "size",
                              e.target.value,
                            )
                          }
                          className="admin-select"
                          style={{ width: "100%" }}
                        >
                          {AVAILABLE_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="admin-form-label">Price (₹) *</label>
                        <input
                          type="number"
                          value={v.price}
                          min="0"
                          placeholder="e.g. 1490"
                          onChange={(e) =>
                            handleVariantFieldChange(
                              v.id,
                              "price",
                              e.target.value,
                            )
                          }
                          className="admin-search-input"
                          style={{ width: "100%", paddingLeft: "0.65rem" }}
                          required
                        />
                      </div>

                      {/* Stock */}
                      <div>
                        <label className="admin-form-label">Stock *</label>
                        <input
                          type="number"
                          value={v.stock}
                          min="0"
                          placeholder="e.g. 25"
                          onChange={(e) =>
                            handleVariantFieldChange(
                              v.id,
                              "stock",
                              e.target.value,
                            )
                          }
                          className="admin-search-input"
                          style={{ width: "100%", paddingLeft: "0.65rem" }}
                          required
                        />
                      </div>
                    </div>

                    {/* Professional Square Image Upload for this Variant */}
                    <div className="admin-image-upload-wrapper">
                      <label
                        className="admin-form-label"
                        style={{ marginBottom: "6px" }}
                      >
                        Product Photos (Multiple Allowed)
                      </label>

                      <div className="admin-image-grid">
                        {/* Hidden Native File Input */}
                        <input
                          type="file"
                          id={`variant-upload-${v.id}`}
                          multiple
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleVariantImageUpload(v.id, e)}
                        />

                        {/* Professional 1:1 Square Upload Button */}
                        <label
                          htmlFor={`variant-upload-${v.id}`}
                          className="admin-upload-square-btn"
                        >
                          <svg
                            className="admin-upload-square-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span className="admin-upload-square-text">
                            + Add Photos
                          </span>
                        </label>

                        {/* Square Preview Tiles */}
                        {v.images.map((img, idx) => (
                          <div key={idx} className="admin-preview-square-tile">
                            <img src={img} alt={`Preview ${idx + 1}`} />

                            {/* 'Cover' tag on the very first photo */}
                            {idx === 0 && (
                              <span className="admin-preview-cover-badge">
                                Primary
                              </span>
                            )}

                            {/* Floating Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(v.id, idx)}
                              className="admin-preview-delete-btn"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div
            style={{
              padding: "1rem 1.75rem",
              borderTop: "1px solid #e7e5e4",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              backgroundColor: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating Product..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
