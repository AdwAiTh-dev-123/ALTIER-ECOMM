import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner"></div>
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Logged in but not admin -> redirect to storefront home
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

export default AdminRoute;
