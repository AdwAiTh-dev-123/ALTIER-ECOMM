import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import "../../styles/common/Navbar.css";

export const Navbar = () => {
  const { getTotalCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const cartCount = getTotalCount ? getTotalCount() : 0;
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdmin = user?.role === "admin";

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const closeDrawer = () => setIsMobileOpen(false);

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={closeDrawer}>
          <img src="/logo.png" alt="ALTIER" className="navbar-logo-img" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>

          <Link
            to="/collections"
            className={`nav-link ${location.pathname.startsWith("/collections") ? "active" : ""}`}
          >
            Collections
          </Link>

          {user && !isAdmin && (
            <>
              <Link
                to="/wishlist"
                className={`nav-link ${location.pathname === "/wishlist" ? "active" : ""}`}
              >
                Wishlist
                {wishlistCount > 0 && (
                  <span
                    className="cart-badge badge-saved"
                    style={{ marginLeft: "6px" }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}
              >
                Cart
                {cartCount > 0 && (
                  <span className="cart-badge" style={{ marginLeft: "6px" }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/orders"
                className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}
                style={{ fontSize: "0.85rem", textDecoration: "none" }}
                title="View your orders"
              >
                Orders
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link nav-link-admin ${isAdminRoute ? "active" : ""}`}
            >
              <span className="admin-dot-indicator">●</span> Admin Console
            </Link>
          )}
        </nav>

        {/* User Profile & Auth Section (Desktop) + Mobile Toggle */}
        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-menu">
              <Link
                to="/profile"
                className="user-profile-badge"
                title="My Profile"
                onClick={closeDrawer}
              >
                {user.picture || user.avatar ? (
                  <img
                    src={user.picture || user.avatar}
                    alt={user.name}
                    className="user-avatar-initial"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="user-avatar-initial">
                    {(user.name || "User").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="user-name-text">
                  {(user.name || "User").split(" ")[0]}
                </span>
                {user.role === "admin" && (
                  <span className="nav-role-tag">Admin</span>
                )}
              </Link>

              <button
                type="button"
                className="btn-nav-logout"
                onClick={handleLogout}
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/login" className="action-link">
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-secondary btn-sm nav-reg-btn"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Slide-In Drawer */}
      {isMobileOpen && (
        <div className="navbar-mobile-overlay" onClick={closeDrawer}>
          <div
            className="navbar-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              <img
                src="/logo.png"
                alt="ALTIER"
                className="navbar-logo-img"
                style={{ height: "38px" }}
              />
              <button
                type="button"
                className="drawer-close-btn"
                onClick={closeDrawer}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* User Profile Card (if authenticated) */}
            {user && (
              <div className="drawer-user-info">
                <div className="user-avatar-initial">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="drawer-user-details">
                  <span className="drawer-user-name">{user.name}</span>
                  {user.role === "admin" && (
                    <span className="drawer-user-role">Admin Console</span>
                  )}
                </div>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <div className="drawer-nav-list">
              <Link
                to="/"
                className={`drawer-nav-link ${location.pathname === "/" ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>Home</span>
                <span>&rarr;</span>
              </Link>

              <Link
                to="/collections"
                className={`drawer-nav-link ${location.pathname.startsWith("/collections") ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>Collections</span>
                <span>&rarr;</span>
              </Link>

              {user && !isAdmin && (
                <>
                  <Link
                    to="/wishlist"
                    className={`drawer-nav-link ${location.pathname === "/wishlist" ? "active" : ""}`}
                    onClick={closeDrawer}
                  >
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="cart-badge badge-saved">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/cart"
                    className={`drawer-nav-link ${location.pathname === "/cart" ? "active" : ""}`}
                    onClick={closeDrawer}
                  >
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="cart-badge">{cartCount}</span>
                    )}
                  </Link>

                  <Link
                    to="/orders"
                    className={`drawer-nav-link ${location.pathname === "/orders" ? "active" : ""}`}
                    onClick={closeDrawer}
                  >
                    <span>My Orders</span>
                    <span>&rarr;</span>
                  </Link>

                  <Link
                    to="/profile"
                    className={`drawer-nav-link ${location.pathname === "/profile" ? "active" : ""}`}
                    onClick={closeDrawer}
                  >
                    <span>Profile & Settings</span>
                    <span>&rarr;</span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`drawer-nav-link admin-link ${isAdminRoute ? "active" : ""}`}
                  onClick={closeDrawer}
                >
                  <span>● Admin Console</span>
                  <span>&rarr;</span>
                </Link>
              )}
            </div>

            {/* Drawer Footer (Auth actions) */}
            <div className="drawer-footer">
              {user ? (
                <button
                  type="button"
                  className="drawer-btn-logout"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              ) : (
                <div className="drawer-auth-buttons">
                  <Link
                    to="/login"
                    className="drawer-btn-signin"
                    onClick={closeDrawer}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="drawer-btn-register"
                    onClick={closeDrawer}
                  >
                    Register New Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
