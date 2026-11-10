import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import "../../styles/auth.css";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams();
  const token = routeToken || searchParams.get("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Live Password Security Checklist Rules
  const passwordChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  };

  const isPasswordSecure = Object.values(passwordChecks).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const validate = () => {
    const errors = {};

    if (!formData.password) {
      errors.password = "Please enter your new password";
    } else if (!isPasswordSecure) {
      errors.password =
        "Please satisfy all password security requirements below";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!token) {
      setServerError(
        "Reset token is missing. Please request a new recovery link.",
      );
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await resetPassword({
        token,
        password: formData.password,
      });

      setSuccessMessage(
        res.data?.message ||
          "Password reset successful! Redirecting to login...",
      );

      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Password reset failed. The link may have expired.";
      setServerError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-wordmark">ALTIER</div>
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">
            Enter and confirm your new secure password below.
          </p>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="auth-alert-error" role="alert">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="auth-alert-success" role="alert">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Missing Token Guard */}
        {!token ? (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <p
              style={{
                color: "#78716C",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              No valid password reset token was detected in your URL link.
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              Request New Link &rarr;
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                New Password
              </label>
              <div className="form-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className={`form-input ${fieldErrors.password ? "input-error" : ""}`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting || !!successMessage}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="inline-error">{fieldErrors.password}</span>
              )}

              {/* Password Checklist */}
              <div className="password-checklist">
                <span className="checklist-title">
                  Password Security Rules:
                </span>
                <div className="checklist-grid">
                  <span
                    className={`check-item ${passwordChecks.length ? "met" : ""}`}
                  >
                    {passwordChecks.length ? "✓" : "○"} 8+ characters
                  </span>
                  <span
                    className={`check-item ${passwordChecks.upper ? "met" : ""}`}
                  >
                    {passwordChecks.upper ? "✓" : "○"} Uppercase letter
                  </span>
                  <span
                    className={`check-item ${passwordChecks.lower ? "met" : ""}`}
                  >
                    {passwordChecks.lower ? "✓" : "○"} Lowercase letter
                  </span>
                  <span
                    className={`check-item ${passwordChecks.number ? "met" : ""}`}
                  >
                    {passwordChecks.number ? "✓" : "○"} Number (0–9)
                  </span>
                  <span
                    className={`check-item ${passwordChecks.special ? "met" : ""}`}
                  >
                    {passwordChecks.special ? "✓" : "○"} Symbol (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="form-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className={`form-input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting || !!successMessage}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex="-1"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="inline-error">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !!successMessage}
            >
              {isSubmitting ? "Updating Password..." : "Update Password →"}
            </button>
          </form>
        )}

        {/* Footer Redirect */}
        <div className="auth-footer">
          Back to
          <Link to="/login" className="auth-footer-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
