import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import '../../styles/auth.css';

const RegisterPage = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      errors.name = 'Please provide your full name';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!trimmedEmail) {
      errors.email = 'Please provide your email address';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isPasswordSecure) {
      errors.password = 'Please meet all password security rules below';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Automatically logged in on register -> redirect to home!
      navigate('/');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Registration failed. Please try again.';
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join us to curate and save your personal garment collection.
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

        {/* One-Click Google Sign-up */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await loginWithGoogle({ idToken: credentialResponse.credential });
                navigate('/');
              } catch (err) {
                setServerError('Google registration failed. Please try again.');
              }
            }}
            onError={() => {
              setServerError('Google signup was cancelled or failed.');
            }}
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or create with email</span>
        </div>

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="form-input-wrapper">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. John Doe"
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.name && (
              <span className="inline-error">{fieldErrors.name}</span>
            )}
          </div>

          {/* Email Address Field */}
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
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
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
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="inline-error">{fieldErrors.password}</span>
            )}

            {/* Live Password Security Checklist */}
            <div className="password-checklist">
              <span className="checklist-title">Password Security Rules:</span>
              <div className="checklist-grid">
                <span className={`check-item ${passwordChecks.length ? 'met' : ''}`}>
                  {passwordChecks.length ? '✓' : '○'} 8+ characters
                </span>
                <span className={`check-item ${passwordChecks.upper ? 'met' : ''}`}>
                  {passwordChecks.upper ? '✓' : '○'} Uppercase letter
                </span>
                <span className={`check-item ${passwordChecks.lower ? 'met' : ''}`}>
                  {passwordChecks.lower ? '✓' : '○'} Lowercase letter
                </span>
                <span className={`check-item ${passwordChecks.number ? 'met' : ''}`}>
                  {passwordChecks.number ? '✓' : '○'} Number (0–9)
                </span>
                <span className={`check-item ${passwordChecks.special ? 'met' : ''}`}>
                  {passwordChecks.special ? '✓' : '○'} Symbol (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="inline-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        {/* Footer Redirect to Login */}
        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-footer-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
