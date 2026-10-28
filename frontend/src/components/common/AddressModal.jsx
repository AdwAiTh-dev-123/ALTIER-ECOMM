import React, { useState, useEffect } from "react";

export const AddressModal = ({
  isOpen,
  onClose,
  onSave,
  editAddress = null,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "Home",
    isDefault: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editAddress) {
      setFormData({
        fullName: editAddress.fullName || "",
        phone: editAddress.phone || "",
        streetAddress: editAddress.streetAddress || "",
        apartment: editAddress.apartment || "",
        city: editAddress.city || "",
        state: editAddress.state || "",
        postalCode: editAddress.postalCode ? String(editAddress.postalCode) : "",
        country: editAddress.country || "India",
        addressType: editAddress.addressType || "Home",
        isDefault: Boolean(editAddress.isDefault),
      });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        streetAddress: "",
        apartment: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        addressType: "Home",
        isDefault: false,
      });
    }
    setError("");
  }, [editAddress, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.streetAddress.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.postalCode.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      setError("Please enter a valid 6-digit postal PIN code.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        postalCode: Number(formData.postalCode.trim()),
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save address."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content address-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{editAddress ? "Edit Shipping Address" : "Add New Shipping Address"}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {error && <div className="cart-inline-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="address-form-grid">
          <div className="form-group full-width">
            <label htmlFor="addr-fullName">Full Name *</label>
            <input
              id="addr-fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Adwaith Sharma"
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="addr-phone">Mobile Number *</label>
            <input
              id="addr-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="addr-street">Street Address *</label>
            <input
              id="addr-street"
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              placeholder="Flat / House No., Building, Street Name"
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="addr-apt">Apartment, Suite, Landmark (Optional)</label>
            <input
              id="addr-apt"
              type="text"
              name="apartment"
              value={formData.apartment}
              onChange={handleChange}
              placeholder="Nearby landmark, suite or floor"
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="addr-city">City *</label>
            <input
              id="addr-city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              required
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="addr-state">State *</label>
            <input
              id="addr-state"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              required
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="addr-pin">PIN Code *</label>
            <input
              id="addr-pin"
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="6-digit PIN"
              maxLength={6}
              required
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="addr-type">Address Type</label>
            <select
              id="addr-type"
              name="addressType"
              value={formData.addressType}
              onChange={handleChange}
            >
              <option value="Home">Home (All-day delivery)</option>
              <option value="Work">Work (10 AM - 6 PM)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group full-width checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              <span>Set as default shipping address</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editAddress
                  ? "Update Address"
                  : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
