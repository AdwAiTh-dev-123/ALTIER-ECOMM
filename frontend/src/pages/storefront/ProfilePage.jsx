// frontend/src/pages/storefront/ProfilePage.jsx
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
import "../../styles/storefront/ProfilePage.css";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Live password criteria validation aligned with Brocamp Guideline 4 & Backend
  const passwordChecks = {
    length: passwordData.newPassword.length >= 8,
    upper: /[A-Z]/.test(passwordData.newPassword),
    lower: /[a-z]/.test(passwordData.newPassword),
    number: /[0-9]/.test(passwordData.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword),
  };

  const isPasswordSecure = Object.values(passwordChecks).every(Boolean);

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

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsUploadingAvatar(true);
      const res = await updateAvatarApi(formData);
      showToast("Profile photo updated successfully!");
      if (checkSession) {
        await checkSession();
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to upload profile picture",
        "error"
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      showToast("Address updated successfully");
    } else {
      await addAddressApi(formData);
      showToast("Address added successfully");
    }
    setIsModalOpen(false);
    setEditingAddress(null);
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

    // Validate strength against Brocamp Guideline 4
    if (!isPasswordSecure) {
      setPasswordStatus({
        loading: false,
        error:
          "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
        success: "",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({
        loading: false,
        error: "New password and confirmation password do not match",
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
        <div className={`profile-floating-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Hidden file input for Avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="profile-hidden-input"
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
              <div className="section-header-row">
                <h2>Saved Delivery Addresses</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddModal}
                >
                  + Add New Address
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="profile-loading-state">
                  <div className="profile-spinner"></div>
                  <p>Loading your saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="empty-addresses-card">
                  <p>You have not added any delivery addresses yet.</p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleOpenAddModal}
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="address-grid">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`address-card ${addr.isDefault ? "is-default" : ""}`}
                    >
                      <div className="address-card-header">
                        <h3 className="address-name">{addr.name}</h3>
                        {addr.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                      </div>

                      <div className="address-body">
                        <div>{addr.street}</div>
                        <div>
                          {addr.city}, {addr.state} - {addr.zipCode}
                        </div>
                        <div>{addr.country}</div>
                        <div className="address-phone">Phone: {addr.phone}</div>
                      </div>

                      <div className="address-card-actions">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            className="card-action-btn"
                            onClick={() => handleSetDefault(addr._id)}
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={() => handleOpenEditModal(addr)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="card-action-btn delete-action"
                          onClick={() => handleDeleteAddress(addr._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === "security" && (
            <section className="profile-security-card">
              <div className="security-card-header">
                <span className="editorial-eyebrow">ACCOUNT PROTECTION</span>
                <h2>Change Password</h2>
                <p>
                  Ensure your account is protected by using a strong password with at
                  least 8 characters.
                </p>
              </div>

              {user?.googleId && (
                <div className="google-auth-notice">
                  ℹ️ You are signed in via Google. If you create a password below, you will also be able to sign in using your email and password.
                </div>
              )}

              {passwordStatus.error && (
                <div className="profile-status-banner error">
                  {passwordStatus.error}
                </div>
              )}

              {passwordStatus.success && (
                <div className="profile-status-banner success">
                  ✓ {passwordStatus.success}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="password-change-form">
                {/* Current Password (Optional if user only logged in with Google) */}
                {!user?.googleId && (
                  <div className="profile-form-group">
                    <label className="profile-form-label" htmlFor="currentPassword">
                      Current Password *
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
                        required
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
                )}

                {/* New Password */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="newPassword">
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
                      placeholder="At least 8 characters"
                      required
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

                  {/* Live Criteria Checklist */}
                  <div className="profile-password-criteria">
                    <div className="criteria-title">Password Requirements:</div>
                    <ul className="criteria-list">
                      <li className={`criteria-item ${passwordChecks.length ? "valid" : ""}`}>
                        <span className="check-icon">{passwordChecks.length ? "✓" : "○"}</span>
                        <span>At least 8 characters</span>
                      </li>
                      <li className={`criteria-item ${passwordChecks.upper ? "valid" : ""}`}>
                        <span className="check-icon">{passwordChecks.upper ? "✓" : "○"}</span>
                        <span>One uppercase letter (A-Z)</span>
                      </li>
                      <li className={`criteria-item ${passwordChecks.lower ? "valid" : ""}`}>
                        <span className="check-icon">{passwordChecks.lower ? "✓" : "○"}</span>
                        <span>One lowercase letter (a-z)</span>
                      </li>
                      <li className={`criteria-item ${passwordChecks.number ? "valid" : ""}`}>
                        <span className="check-icon">{passwordChecks.number ? "✓" : "○"}</span>
                        <span>One numeric digit (0-9)</span>
                      </li>
                      <li className={`criteria-item ${passwordChecks.special ? "valid" : ""}`}>
                        <span className="check-icon">{passwordChecks.special ? "✓" : "○"}</span>
                        <span>One special character (!@#$%^&*)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="confirmPassword">
                    Confirm New Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
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
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="security-form-actions">
                  <button
                    type="submit"
                    className="btn-update-password"
                    disabled={passwordStatus.loading || !isPasswordSecure}
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
