import api from "./axiosClient";

export function getStorefrontCategories() {
  return api.get("/categories");
}

export function getStorefrontProducts(params = {}) {
  return api.get("/products", { params });
}

export function getStorefrontProductById(id) {
  return api.get(`/products/${id}`);
}
