import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";

export const Navbar = () => {
  const { getTotalCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = getTotalCount ? getTotalCount() : 0;
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="ALTIER" className="navbar-logo-img" />
        </Link>

        {/* Main Navigation */}
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

        {/* User Profile & Auth Section */}
        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-menu">
              <Link
                to="/profile"
                className="user-profile-badge"
                title="My Profile"
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
