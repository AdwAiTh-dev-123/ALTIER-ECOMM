import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      errors.email = "Please enter your email address";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Please enter your password";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const user = response?.user;
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const data = err.response?.data;
      const baseMessage =
        data?.message || "Unable to sign in. Please verify your credentials.";

      const attemptsMade = data?.attemptsMade;
      const attemptsLeft = data?.attemptsLeft;

      if (
        typeof attemptsMade === "number" &&
        attemptsMade >= 6 &&
        typeof attemptsLeft === "number"
      ) {
        if (attemptsLeft > 0) {
          setServerError(
            `${baseMessage} — ⚠️ Warning: Attempt ${attemptsMade} of 10. You have only ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left before your account is locked.`,
          );
        } else {
          setServerError(baseMessage);
        }
      } else {
        setServerError(baseMessage);
      }
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to access your saved pieces and orders.
          </p>
        </div>

        {/* Global Server Error Banner */}
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

        {/* Social / Google Sign-in */}
        <div
          style={{ display: "flex", justifyContent: "center", width: "100%" }}
        >
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const response = await loginWithGoogle({
                  idToken: credentialResponse.credential,
                });
                const user = response?.user;
                if (user?.role === "admin") {
                  navigate("/admin", { replace: true });
                } else {
                  navigate("/", { replace: true });
                }
              } catch (err) {
                const errorMsg =
                  err.response?.data?.message ||
                  "Google sign-in failed.Please try again";
                setServerError(errorMsg);
              }
            }}
            onError={() => {
              setServerError("Google sign-in popup was cancelled or failed.");
            }}
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Credentials Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
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
                className={`form-input ${fieldErrors.email ? "input-error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.email && (
              <span className="inline-error">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`form-input ${fieldErrors.password ? "input-error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
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
          </div>

          {/* Options Row (Remember me & Forgot Password) */}
          <div className="form-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                name="rememberMe"
                className="remember-checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit CTA */}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In →"}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-footer-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
