import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAddressesApi,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from "../../api/shopApi";
import { changePasswordApi, updateAvatarApi } from "../../api/authApi";
import AddressModal from "../../components/common/AddressModal";

export const ProfilePage = () => {
  const { user, checkSession } = useAuth();
  const isAdmin = user?.role === "admin";

  // Tab navigation: "addresses" | "security"
  const [activeTab, setActiveTab] = useState("addresses");

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Change password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  // Global toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 1. Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    if (isAdmin) {
      setIsLoadingAddresses(false);
      return;
    }

    try {
      setIsLoadingAddresses(true);
      const res = await getAddressesApi();
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load addresses",
        "error"
      );
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      fetchAddresses();
    } else {
      setIsLoadingAddresses(false);
    }
  }, [fetchAddresses, isAdmin]);

  // 2. Avatar Upload Handlers
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file (PNG, JPG, WEBP).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be smaller than 5MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsUploadingAvatar(true);
      const res = await updateAvatarApi(formData);
      if (res.data.success) {
        await checkSession();
        showToast("Profile photo updated successfully!");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to upload profile photo",
        "error"
      );
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = "";
    }
  };

  // 3. Address Handlers
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    if (editingAddress) {
      await updateAddressApi(editingAddress._id, formData);
      showToast("Address updated successfully!");
    } else {
      await addAddressApi(formData);
      showToast("Address saved successfully!");
    }
    await fetchAddresses();
  };

  const handleDeleteAddress = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this address?"
    );
    if (!confirmed) return;

    try {
      await deleteAddressApi(id);
      showToast("Address removed successfully");
      await fetchAddresses();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete address",
        "error"
      );
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddressApi(id);
      showToast("Default address updated");
      await fetchAddresses();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to set default address",
        "error"
      );
    }
  };

  // 4. Change Password Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: "", success: "" });

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({
        loading: false,
        error: "New password must be at least 6 characters long",
        success: "",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({
        loading: false,
        error: "New passwords do not match",
        success: "",
      });
      return;
    }

    try {
      const res = await changePasswordApi({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordStatus({
        loading: false,
        error: "",
        success: res.data.message || "Password changed successfully!",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showToast("Password updated successfully!");
    } catch (err) {
      setPasswordStatus({
        loading: false,
        error: err.response?.data?.message || "Failed to change password",
        success: "",
      });
    }
  };

  return (
    <div className="profile-page-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`cart-floating-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Hidden file input for Avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Profile Header Card */}
      <div className="profile-header-card">
        {/* Avatar with Camera badge */}
        <div className="profile-avatar-wrapper">
          <div
            className="profile-avatar-circle"
            onClick={handleAvatarClick}
            title="Click to change profile picture"
          >
            {user?.avatar || user?.picture ? (
              <img
                src={user.avatar || user.picture}
                alt={user.name}
                className="profile-avatar-img"
              />
            ) : (
              <span>{(user?.name || "U").charAt(0).toUpperCase()}</span>
            )}

            <div className="profile-avatar-hover-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Edit</span>
            </div>

            {isUploadingAvatar && (
              <div className="avatar-uploading-overlay">
                <div className="avatar-mini-spinner"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="avatar-upload-badge-btn"
            onClick={handleAvatarClick}
            title="Upload new profile picture"
            aria-label="Upload new profile picture"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        <div className="profile-user-details">
          <span className="editorial-eyebrow">ACCOUNT OVERVIEW</span>
          <h1 className="profile-user-name">{user?.name || "Customer"}</h1>
          <p className="profile-user-email">{user?.email}</p>
          <div className="profile-meta-tags">
            <span className="profile-role-pill">{user?.role || "customer"}</span>
            {user?.googleId && (
              <span className="profile-google-pill">Connected via Google</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Admin View vs Customer Profile Sections */}
      {isAdmin ? (
        <section className="profile-admin-notice-card">
          <div className="admin-notice-icon">🛡️</div>
          <h2>Administrator Account</h2>
          <p>
            Delivery addresses are only applicable to customer accounts for checkout.
            As an administrator, you manage orders, stock, categories, and users from
            the Admin Console.
          </p>
          <Link to="/admin" className="btn btn-primary">
            Open Admin Console &rarr;
          </Link>
        </section>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="profile-nav-tabs">
            <button
              type="button"
              className={`profile-tab-button ${activeTab === "addresses" ? "active" : ""}`}
              onClick={() => setActiveTab("addresses")}
            >
              <span>Saved Addresses</span>
              <span className="tab-count-badge">{addresses.length}</span>
            </button>

            <button
              type="button"
              className={`profile-tab-button ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <span>Security & Password</span>
            </button>
          </div>

          {/* TAB 1: Saved Addresses */}
          {activeTab === "addresses" && (
            <section className="profile-addresses-section">
              <div className="addresses-section-header">
                <div>
                  <span className="editorial-eyebrow">SHIPPING BOOK</span>
                  <h2 className="section-title">Saved Delivery Addresses</h2>
                  <p className="section-subtitle">
                    Manage your saved addresses for fast and seamless checkout.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm add-address-btn"
                  onClick={handleOpenAddModal}
                >
                  + Add New Address
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="profile-loading-state">
                  <div className="cart-spinner-small"></div>
                  <p>Loading your addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="addresses-empty-card">
                  <div className="empty-card-icon">📍</div>
                  <h3>No addresses saved yet</h3>
                  <p>
                    Add a delivery address so you can checkout quickly when purchasing.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenAddModal}
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="addresses-grid">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`address-card ${addr.isDefault ? "is-default" : ""}`}
                    >
                      <div className="address-card-top">
                        <span className="address-type-tag">{addr.addressType}</span>
                        {addr.isDefault && (
                          <span className="address-default-badge">
                            ✓ Default Shipping
                          </span>
                        )}
                      </div>

                      <div className="address-card-body">
                        <h3 className="recipient-name">{addr.fullName}</h3>
                        <p className="address-text-line">{addr.streetAddress}</p>
                        {addr.apartment && (
                          <p className="address-text-line">{addr.apartment}</p>
                        )}
                        <p className="address-text-line">
                          {addr.city}, {addr.state} - <strong>{addr.postalCode}</strong>
                        </p>
                        <p className="address-text-line">{addr.country || "India"}</p>
                        <p className="address-phone-line">
                          <span className="phone-icon">📞</span> +91 {addr.phone}
                        </p>
                      </div>

                      <div className="address-card-footer">
                        <div className="left-actions">
                          <button
                            type="button"
                            className="card-action-btn edit-action"
                            onClick={() => handleOpenEditModal(addr)}
                          >
                            Edit
                          </button>
                          <span className="action-divider">|</span>
                          <button
                            type="button"
                            className="card-action-btn delete-action"
                            onClick={() => handleDeleteAddress(addr._id)}
                          >
                            Delete
                          </button>
                        </div>

                        {!addr.isDefault && (
                          <button
                            type="button"
                            className="set-default-btn"
                            onClick={() => handleSetDefault(addr._id)}
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === "security" && (
            <section className="profile-security-card">
              <div className="security-card-header">
                <span className="editorial-eyebrow">ACCOUNT PROTECTION</span>
                <h2>Change Password</h2>
                <p>
                  Ensure your account is protected by using a strong password with at
                  least 6 characters.
                </p>
              </div>

              {passwordStatus.error && (
                <div className="cart-inline-error-banner" style={{ marginBottom: "1.25rem" }}>
                  {passwordStatus.error}
                </div>
              )}

              {passwordStatus.success && (
                <div className="cart-floating-toast success" style={{ position: "static", marginBottom: "1.25rem" }}>
                  ✓ {passwordStatus.success}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="password-change-form">
                {/* Current Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      className="profile-form-input"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      tabIndex="-1"
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">
                    New Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      className="profile-form-input"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      tabIndex="-1"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirm New Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      className="profile-form-input"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <div className="security-form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-update-password"
                    disabled={passwordStatus.loading}
                  >
                    {passwordStatus.loading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Reusable Address Modal for Customers */}
          <AddressModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingAddress(null);
            }}
            onSave={handleSaveAddress}
            editAddress={editingAddress}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
