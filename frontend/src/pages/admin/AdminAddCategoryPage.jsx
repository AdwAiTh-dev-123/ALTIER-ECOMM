import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createAdminCategory } from "../../api/adminApi";

const AdminAddCategoryPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isListed: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    setLoading(true);
    try {
      await createAdminCategory(formData);
      setSuccessMessage("Category added successfully!");
      setTimeout(() => {
        navigate("/admin/categories");
      }, 1200);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to add category. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 className="admin-page-title">Add New Category</h1>
            <p className="admin-page-subtitle">
              Create a new apparel classification for products.
            </p>
          </div>
          <Link to="/admin/categories" className="admin-btn-secondary">
            ← Back to Categories
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-alert-banner alert-danger">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="admin-alert-banner alert-success">{successMessage}</div>
      )}

      <div className="admin-panel-card" style={{ maxWidth: "680px" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div className="admin-form-group">
            <label className="admin-form-label">Category Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Heavyweight Knitwear"
              className="admin-search-input"
              style={{ paddingLeft: "0.85rem", width: "100%" }}
              required
            />
        
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of products within this category..."
              rows={4}
              className="admin-search-input"
              style={{
                paddingLeft: "0.85rem",
                width: "100%",
                resize: "vertical",
              }}
            />
          </div>

          <div
            className="admin-form-group"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <input
              type="checkbox"
              id="isListed"
              name="isListed"
              checked={formData.isListed}
              onChange={handleChange}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label
              htmlFor="isListed"
              style={{ fontSize: "0.88rem", cursor: "pointer" }}
            >
              Publish & List on Storefront immediately
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <Link to="/admin/categories" className="admin-btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="admin-action-btn"
              style={{
                backgroundColor: "#1c1917",
                color: "#fff",
                padding: "0.6rem 1.4rem",
              }}
            >
              {loading ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddCategoryPage;
