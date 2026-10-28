import React, { useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/storefront/HomePage";
import ShopPage from "./pages/storefront/ShopPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminRoute from "./routes/AdminRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminAddCategoryPage from "./pages/admin/AdminAddCategoryPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import ProductDetailsPage from "./pages/storefront/ProductDetailsPage";
import CartPage from "./pages/storefront/CartPage";
import WishlistPage from "./pages/storefront/WishlistPage";

import "./App.css";
import "./styles/storefront.css";

// Shared Public Storefront Layout
const StorefrontLayout = ({ children }) => (
  <div className="app-root">
    <Navbar />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

// Listens for route changes and verifies that logged-in users are not blocked
const RouteNavigationWatcher = () => {
  const location = useLocation();
  const { user, checkSession } = useAuth();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only verify session when the user actually navigates to a different page
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (user) {
        checkSession();
      }
    }
  }, [location.pathname, user, checkSession]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <RouteNavigationWatcher />
      <Routes>
        {/* Auth routes for guest users only */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />

        {/* Public Storefront Routes */}
        <Route
          path="/"
          element={
            <StorefrontLayout>
              <HomePage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/collections"
          element={
            <StorefrontLayout>
              <ShopPage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <StorefrontLayout>
              <ProductDetailsPage />
            </StorefrontLayout>
          }
        />

        {/* User-Specific Storefront Routes (Protected: Logged-in only) */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <StorefrontLayout>
                <CartPage />
              </StorefrontLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <StorefrontLayout>
                <WishlistPage />
              </StorefrontLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <StorefrontLayout>
                <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <h2>User Profile</h2>
                  <p>Account details and past orders</p>
                </div>
              </StorefrontLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Console Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="categories/add" element={<AdminAddCategoryPage />} />
          <Route path="products" element={<AdminProductsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
