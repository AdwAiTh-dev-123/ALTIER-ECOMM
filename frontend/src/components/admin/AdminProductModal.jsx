import React, { useState, useEffect, useRef } from "react";
import {
  getAdminCategories,
  createAdminProduct,
  updateAdminProduct,
} from "../../api/adminApi";
import "../../styles/admins/AdminProductModal.css";
import ImageCropperModal from "./ImageCropperModal";
import axiosClient from "../../api/axiosClient";

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

const AddProductModal = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit = null,
}) => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Image cropper queue state
  const [cropQueue, setCropQueue] = useState([]); // [{ fileSrc, variantId }]
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [uploadingVariants, setUploadingVariants] = useState({}); // { [variantId]: count }
  const isAnyUploading = Object.values(uploadingVariants).some((count) => count > 0);

  // In-DOM Category Dropdown State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Product Core State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  // Variants State
  const [variants, setVariants] = useState([createEmptyVariant()]);

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const selectedCategoryName =
    categories.find((cat) => cat._id === categoryId)?.name || "";

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await getAdminCategories({ limit: 100, status: "active" });
      const list = res.data.data || [];
      setCategories(list);
      if (!productToEdit && list.length > 0) setCategoryId(list[0]._id);
    } catch (err) {
      setError("Failed to load categories for dropdown.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Pre-populate when editing or reset when adding
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (productToEdit) {
        setName(productToEdit.name || "");
        setCategoryId(
          productToEdit.category?._id || productToEdit.category || "",
        );
        setDescription(productToEdit.description || "");
        if (
          Array.isArray(productToEdit.variants) &&
          productToEdit.variants.length > 0
        ) {
          setVariants(
            productToEdit.variants.map((v) => ({
              _id: v._id,
              id: v._id || Date.now() + Math.random(),
              size: v.size || "M",
              color: v.color || "Black",
              price: v.price !== undefined ? v.price : "",
              stock: v.stock !== undefined ? v.stock : "",
              images: Array.isArray(v.images) ? v.images : [],
            })),
          );
        } else {
          setVariants([createEmptyVariant()]);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, productToEdit]);

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  };

  const handleRemoveVariant = (idToRemove) => {
    if (variants.length <= 1) {
      setError("Product must have at least one variant.");
      return;
    }
    setError("");
    setVariants((prev) => prev.filter((v) => v.id !== idToRemove));
  };

  const handleVariantFieldChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const handleVariantImageUpload = (variantId, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    e.target.value = "";

    const queued = files.map((file) => ({
      fileSrc: URL.createObjectURL(file),
      variantId,
    }));
    setCropQueue(queued);
    setCurrentCropIndex(0);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = async (croppedBlob) => {
    const currentItem = cropQueue[currentCropIndex];
    if (!currentItem) return;
    URL.revokeObjectURL(currentItem.fileSrc);
    const targetVariantId = currentItem.variantId;

    if (currentCropIndex + 1 < cropQueue.length) {
      setCurrentCropIndex((prev) => prev + 1);
    } else {
      setIsCropModalOpen(false);
      setCropQueue([]);
      setCurrentCropIndex(0);
    }

    setUploadingVariants((prev) => ({
      ...prev,
      [targetVariantId]: (prev[targetVariantId] || 0) + 1,
    }));

    try {
      const formData = new FormData();
      formData.append("image", croppedBlob, "product.webp");
      const res = await axiosClient.post("/admin/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cloudinaryUrl = res.data.url;

      setVariants((prev) =>
        prev.map((v) => {
          if (v.id === targetVariantId) {
            return { ...v, images: [...v.images, cloudinaryUrl] };
          }
          return v;
        }),
      );
    } catch (err) {
      setError("Failed to upload image to Cloudinary. Please try again.");
    } finally {
      setUploadingVariants((prev) => {
        const count = (prev[targetVariantId] || 1) - 1;
        if (count <= 0) {
          const { [targetVariantId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [targetVariantId]: count };
      });
    }
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
      if (productToEdit) {
        await updateAdminProduct(productToEdit._id, {
          name,
          categoryId,
          description,
          variants,
        });
      } else {
        await createAdminProduct({
          name,
          categoryId,
          description,
          variants,
        });
      }
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (productToEdit
            ? "Failed to update product."
            : "Failed to create product."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop">
      <div
        className="admin-product-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="admin-product-modal-header">
          <div>
            <h2 className="admin-product-modal-title">
              {productToEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="admin-product-modal-subtitle">
              {productToEdit
                ? "Update product details and configure size/color variants."
                : "Define base details and configure unique size/color variants."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-product-modal-close-btn"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="admin-product-modal-form">
          <div className="admin-product-modal-body">
            {error && (
              <div className="admin-alert-banner alert-danger">{error}</div>
            )}

            {/* BASE PRODUCT DETAILS */}
            <div className="admin-product-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heavyweight Organic Tee"
                  className="admin-search-input"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Category *</label>
                <div
                  className="admin-modal-custom-dropdown-wrap"
                  ref={categoryDropdownRef}
                >
                  <button
                    type="button"
                    className="admin-modal-dropdown-btn"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    disabled={categoriesLoading}
                    aria-expanded={isCategoryDropdownOpen}
                  >
                    <span className="admin-modal-dropdown-text">
                      {selectedCategoryName ||
                        (categoriesLoading
                          ? "Loading categories..."
                          : "Select a category")}
                    </span>
                    <span
                      className={`admin-dropdown-chevron ${isCategoryDropdownOpen ? "open" : ""}`}
                    >
                      ▾
                    </span>
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="admin-modal-dropdown-menu">
                      {categories.length === 0 ? (
                        <div className="admin-modal-dropdown-empty">
                          No active categories available
                        </div>
                      ) : (
                        categories.map((cat) => {
                          const isSelected = cat._id === categoryId;
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              className={`admin-modal-dropdown-item ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                setCategoryId(cat._id);
                                setIsCategoryDropdownOpen(false);
                              }}
                            >
                              <span>{cat.name}</span>
                              {isSelected && (
                                <span className="admin-dropdown-check">✓</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form-group admin-col-span-2">
                <label className="admin-form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material composition, garment fit, and care instructions..."
                  rows={3}
                  className="admin-product-textarea"
                />
              </div>
            </div>

            {/* VARIANTS SECTION */}
            <div className="admin-variants-section">
              <div className="admin-variants-header">
                <div>
                  <h3 className="admin-variants-title">Product Variants</h3>
                  <span className="admin-variants-subtitle">
                    Each variant holds separate color, size, stock, and photos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="admin-btn-secondary admin-btn-add-variant admin-btn-add-variant-desktop"
                >
                  + Add Variant
                </button>
              </div>

              {/* Dynamic Variant List */}
              <div className="admin-variants-list">
                {variants.map((v, index) => (
                  <div key={v.id} className="admin-variant-card">
                    <div className="admin-variant-header">
                      <span className="admin-variant-badge">
                        Variant #{index + 1}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="admin-variant-delete-btn"
                        >
                          🗑 Delete Variant
                        </button>
                      )}
                    </div>

                    <div className="admin-variant-fields-grid">
                      {/* Color Dropdown */}
                      <div className="admin-form-group">
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
                        >
                          {AVAILABLE_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size Dropdown */}
                      <div className="admin-form-group">
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
                        >
                          {AVAILABLE_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div className="admin-form-group">
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
                          required
                        />
                      </div>

                      {/* Stock */}
                      <div className="admin-form-group">
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
                          required
                        />
                      </div>
                    </div>

                    {/* Professional Square Image Upload for this Variant */}
                    <div className="admin-image-upload-wrapper">
                      <label className="admin-image-label">
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

                        {/* Loading Skeleton Tile while uploading to Cloudinary */}
                        {Array.from({
                          length: uploadingVariants[v.id] || 0,
                        }).map((_, i) => (
                          <div
                            key={`uploading-${i}`}
                            className="admin-preview-square-tile admin-preview-skeleton"
                          >
                            <div className="admin-spinner" />
                            <span className="admin-skeleton-text">
                              Uploading...
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Add Variant Button placed at the bottom */}
              <button
                type="button"
                onClick={handleAddVariant}
                className="admin-btn-secondary admin-btn-add-variant-mobile"
              >
                + Add Variant
              </button>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="admin-product-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary admin-modal-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary admin-modal-btn"
              disabled={submitting || isAnyUploading}
            >
              {isAnyUploading
                ? "Uploading Photos..."
                : submitting
                  ? productToEdit
                    ? "Saving Changes..."
                    : "Creating Product..."
                  : productToEdit
                    ? "Save Changes"
                    : "Add Product"}
            </button>
          </div>
        </form>
      </div>
      <ImageCropperModal
        isOpen={isCropModalOpen}
        imageSrc={cropQueue[currentCropIndex]?.fileSrc}
        currentIndex={currentCropIndex}
        totalImages={cropQueue.length}
        onClose={() => {
          cropQueue.forEach((item) => URL.revokeObjectURL(item.fileSrc));
          setIsCropModalOpen(false);
          setCropQueue([]);
          setCurrentCropIndex(0);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default AddProductModal;
