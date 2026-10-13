import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi";
import "../../styles/auth.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError("");
    if (serverError) setServerError("");
    if (successMessage) setSuccessMessage("");
  };

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      return "Please enter your email address";
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const error = validate();
    if (error) {
      setFieldError(error);
      return;
    }

    setFieldError("");
    setIsSubmitting(true);

    try {
      const res = await forgotPassword({ email: email.trim() });
      setSuccessMessage(
        res.data?.message ||
          "Password reset link has been sent to your email. Please check your inbox or server console."
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Unable to send recovery link. Please verify the email address.";
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
          <div className="auth-wordmark">ATELIER</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your registered email address and we'll send you a 15-minute recovery link.
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

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@domain.com"
                className={`form-input ${fieldError ? "input-error" : ""}`}
                value={email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            {fieldError && <span className="inline-error">{fieldError}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending Link..." : "Send Recovery Link →"}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="auth-footer">
          Remembered your password?
          <Link to="/login" className="auth-footer-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
