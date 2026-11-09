import React, { useEffect, useRef, lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import AdminRoute from "./routes/AdminRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AdminLayout from "./components/admin/AdminLayout";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("./pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

const HomePage = lazy(() => import("./pages/storefront/HomePage"));
const ShopPage = lazy(() => import("./pages/storefront/ShopPage"));
const ProductDetailsPage = lazy(
  () => import("./pages/storefront/ProductDetailsPage"),
);
const CartPage = lazy(() => import("./pages/storefront/CartPage"));
const WishlistPage = lazy(() => import("./pages/storefront/WishlistPage"));
const ProfilePage = lazy(() => import("./pages/storefront/ProfilePage"));
const CheckoutPage = lazy(() => import("./pages/storefront/CheckoutPage"));
const OrderSuccessPage = lazy(
  () => import("./pages/storefront/OrderSuccessPage"),
);
const OrderFailurePage = lazy(
  () => import("./pages/storefront/OrderFailurePage"),
);
const OrdersPage = lazy(() => import("./pages/storefront/OrdersPage"));
const OrderDetailsPage = lazy(
  () => import("./pages/storefront/OrderDetailsPage"),
);

const AdminDashboardPage = lazy(
  () => import("./pages/admin/AdminDashboardPage"),
);
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCategoriesPage = lazy(
  () => import("./pages/admin/AdminCategoriesPage"),
);
const AdminAddCategoryPage = lazy(
  () => import("./pages/admin/AdminAddCategoryPage"),
);
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminCouponsPage = lazy(() => import("./pages/admin/AdminCouponsPage"));
const AdminOffersPage = lazy(() => import("./pages/admin/AdminOffersPage"));
const AdminSalesReportPage = lazy(
  () => import("./pages/admin/AdminSalesReportPage"),
);

const NotFoundPage = lazy(() => import("./pages/common/NotFoundPage"));

import "./App.css";
import "./styles/storefront.css";

const PageLoader = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      color: "#6b7280",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <p style={{ fontSize: "0.875rem", letterSpacing: "0.05em" }}>LOADING...</p>
  </div>
);

// Shared Public Storefront Layout - strictly for customer/guest storefront
const StorefrontLayout = ({ children }) => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="app-root">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

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
      <Suspense fallback={<PageLoader />}>
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
          <Route
            path="/reset-password/:token"
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
            path="/checkout"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <CheckoutPage />
                </StorefrontLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/success/:orderId"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <OrderSuccessPage />
                </StorefrontLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/failure/:orderId"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <OrderFailurePage />
                </StorefrontLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <OrdersPage />
                </StorefrontLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <OrderDetailsPage />
                </StorefrontLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StorefrontLayout>
                  <ProfilePage />
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
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="offers" element={<AdminOffersPage />} />
            <Route path="sales-report" element={<AdminSalesReportPage />} />
          </Route>

          {/* Fallback route */}
          <Route
            path="*"
            element={
              <StorefrontLayout>
                <NotFoundPage />
              </StorefrontLayout>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
