import api from "./axiosClient";

export function getAdminUsers(params = {}) {
  return api.get("/admin/users", { params });
}

export function toggleBlockUserStatus(userId) {
  return api.patch(`/admin/users/${userId}`);
}

export function getAdminCategories(params = {}) {
  return api.get("/admin/category", { params });
}

export function createAdminCategory(data) {
  return api.post("/admin/category", data);
}

export function updateAdminCategory(categoryId, data) {
  return api.put(`/admin/category/${categoryId}`, data);
}
export function deleteAdminCategory(categoryId) {
  return api.delete(`/admin/category/${categoryId}`);
}

export function toggleCategoryStatus(categoryId) {
  return api.patch(`/admin/category/${categoryId}`);
}

export function getAdminProducts(params = {}) {
  return api.get("/admin/products", { params });
}

export function createAdminProduct(data) {
  return api.post("/admin/products", data);
}

export function updateAdminProduct(productId, data) {
  return api.put(`/admin/products/${productId}`, data);
}

export function toggleProductStatus(productId) {
  return api.patch(`/admin/products/${productId}`);
}

export function deleteAdminProduct(productId) {
  return api.delete(`/admin/products/${productId}`);
}

export function getAdminOrders(params = {}) {
  return api.get("/admin/orders", { params });
}
export function getAdminOrderById(orderId) {
  return api.get(`/admin/orders/${orderId}`);
}
export function updateAdminOrderStatus(orderId, data) {
  return api.patch(`/admin/orders/${orderId}/status`, data);
}
export function reviewAdminReturnRequest(orderId, data) {
  return api.patch(`/admin/orders/${orderId}/return-review`, data);
}

export function getAdminSalesReport(params = {}) {
  return api.get("/admin/sales-report", { params });
}

export function downloadAdminSalesReport(params = {}) {
  return api.get("/admin/sales-report/download", {
    params,
    responseType: "blob",
  });
}

// Coupon APIs
export function getAdminCoupons(params = {}) {
  return api.get("/admin/coupons", { params });
}

export function createAdminCoupon(data) {
  return api.post("/admin/coupons", data);
}

export function toggleAdminCouponStatus(couponId) {
  return api.patch(`/admin/coupons/${couponId}/toggle`);
}

export function deleteAdminCoupon(couponId) {
  return api.delete(`/admin/coupons/${couponId}`);
}
