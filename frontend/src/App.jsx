import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ShopPage from "./pages/storefront/ShopPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminRoute from "./routes/AdminRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminAddCategoryPage from "./pages/admin/AdminAddCategoryPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage"

import "./App.css";
import "./styles/storefront.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
          path="/"
          element={
            <ProtectedRoute>
              <div className="app-root">
                <Navbar />
                <main className="main-content">
                  <ShopPage />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
