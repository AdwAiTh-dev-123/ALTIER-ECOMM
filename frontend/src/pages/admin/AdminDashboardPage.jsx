import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers, getAdminProducts } from "../../api/adminApi";
import "../../styles/admins/AdminDashboardPage.css";

const AdminDashboardPage = () => {
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
  });
  const [productStats, setProductStats] = useState({
    total: 0,
    listed: 0,
    unlisted: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [usersRes, productsRes] = await Promise.all([
          getAdminUsers({ limit: 5 }),
          getAdminProducts({ limit: 5 }),
        ]);

        if (usersRes.data?.stats) {
          setUserStats(usersRes.data.stats);
        }
        if (usersRes.data?.data) {
          setRecentUsers(usersRes.data.data.slice(0, 5));
        }

        if (productsRes.data?.stats) {
          setProductStats(productsRes.data.stats);
        }
        if (productsRes.data?.data) {
          setRecentProducts(productsRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard-root">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Overview Dashboard</h1>
          <p className="admin-page-subtitle">
            Real-time status of apparel catalog, inventory, and customer
            activity.
          </p>
        </div>
      </div>

      {/* Product Catalog Stats */}
      <div>
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: "700",
              color: "#1c1917",
              margin: 0,
            }}
          >
            Product Catalog
          </h2>
          <Link
            to="/admin/products"
            style={{
              fontSize: "0.82rem",
              color: "#78716c",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            View Catalog →
          </Link>
        </div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total</span>
              <span className="admin-stat-icon-wrap">📦</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : productStats.total}
            </div>
            <span className="admin-stat-note">All catalog products</span>
          </div>

          <div className="admin-stat-card stat-success">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Listed</span>
              <span className="admin-stat-icon-wrap">✓</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : productStats.listed}
            </div>
            <span className="admin-stat-note">
              Active on customer storefront
            </span>
          </div>

          <div className="admin-stat-card stat-danger">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Unlisted</span>
              <span className="admin-stat-icon-wrap">✕</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : productStats.unlisted}
            </div>
            <span className="admin-stat-note">Hidden from customer store</span>
          </div>
        </div>
      </div>

      {/* User Accounts Stats */}
      <div style={{ marginTop: "0.5rem" }}>
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: "700",
              color: "#1c1917",
              margin: 0,
            }}
          >
            Customer Accounts
          </h2>
          <Link
            to="/admin/users"
            style={{
              fontSize: "0.82rem",
              color: "#78716c",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Manage Users →
          </Link>
        </div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total</span>
              <span className="admin-stat-icon-wrap">👥</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : userStats.total}
            </div>
            <span className="admin-stat-note">Registered user accounts</span>
          </div>

          <div className="admin-stat-card stat-success">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Active</span>
              <span className="admin-stat-icon-wrap">✓</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : userStats.active}
            </div>
            <span className="admin-stat-note">
              Full store & checkout access
            </span>
          </div>

          <div className="admin-stat-card stat-danger">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Blocked</span>
              <span className="admin-stat-icon-wrap">✕</span>
            </div>
            <div className="admin-stat-value">
              {loading ? "..." : userStats.blocked}
            </div>
            <span className="admin-stat-note">
              Access blocked by administrator
            </span>
          </div>
        </div>
      </div>

      {/* Two Recent Activity Panels: Products & Users */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          marginTop: "0.5rem",
        }}
      >
        {/* Recent Added Products Panel */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Recent Added Products</h3>
              <p className="admin-panel-desc">
                Latest apparel and variant additions to your boutique store
              </p>
            </div>
            <Link to="/admin/products" className="admin-btn-secondary">
              Manage All Products →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Variants</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Added Date</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p) => {
                  const firstImg = p.variants?.[0]?.images?.[0];
                  const minPrice = p.variants?.length
                    ? Math.min(...p.variants.map((v) => Number(v.price) || 0))
                    : 0;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div className="admin-prod-thumb">
                            {firstImg ? (
                              <img src={firstImg} alt={p.name} />
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100%",
                                  fontSize: "10px",
                                  color: "#78716c",
                                }}
                              >
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <strong className="admin-table-prod-name">
                              {p.name}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            padding: "2px 8px",
                            backgroundColor: "var(--bg-muted, #f5f4f0)",
                            borderRadius: "4px",
                            color: "#44403c",
                            fontWeight: "500",
                          }}
                        >
                          {p.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#44403c" }}>
                        {p.variants?.length || 0} variants
                      </td>
                      <td
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: "600",
                          color: "#1c1917",
                        }}
                      >
                        ₹{minPrice.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={`admin-status-badge ${
                            p.isListed ? "status-active" : "status-blocked"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {p.isListed ? "Listed" : "Unlisted"}
                        </span>
                      </td>
                      <td
                        className="admin-date-text"
                        style={{ textAlign: "right" }}
                      >
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {recentProducts.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "2.5rem 1rem",
                        color: "#78716c",
                      }}
                    >
                      No products added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent User Registrations Panel */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">Recent User Registrations</h3>
              <p className="admin-panel-desc">
                Latest customers who joined the platform
              </p>
            </div>
            <Link to="/admin/users" className="admin-btn-secondary">
              Manage All Users →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-sm">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="admin-user-name">{u.name}</span>
                      </div>
                    </td>
                    <td className="admin-email-text">{u.email}</td>
                    <td>
                      <span
                        className={`admin-role-badge ${
                          u.role === "admin" ? "badge-admin" : "badge-customer"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          u.isBlocked ? "status-blocked" : "status-active"
                        }`}
                      >
                        <span className="status-dot"></span>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: "center",
                        padding: "2.5rem 1rem",
                        color: "#78716c",
                      }}
                    >
                      No users registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
