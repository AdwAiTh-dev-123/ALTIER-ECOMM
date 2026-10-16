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

export function deleteAdminCategory(categoryId) {
  return api.delete(`/admin/category/${categoryId}`);
}

export function toggleCategoryStatus(categoryId) {
  return api.patch(`/admin/category/${categoryId}`);
}
