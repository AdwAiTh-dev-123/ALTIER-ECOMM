import api from "./axiosClient";

export function getAdminUsers(params = {}) {
  return api.get("/admin/users", { params });
}

export function toggleBlockUserStatus(userId) {
  return api.patch(`/admin/users/${userId}`);
}
