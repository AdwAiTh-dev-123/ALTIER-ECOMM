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

// Cart API (Database-backed)
export function getCartApi() {
  return api.get("/cart");
}

export function addToCartApi(productId, variantId, quantity = 1) {
  return api.post("/cart/add", { productId, variantId, quantity });
}

export function updateCartQuantityApi(variantId, quantity) {
  return api.patch("/cart/update-quantity", { variantId, quantity });
}

export function removeFromCartApi(variantId) {
  return api.delete(`/cart/item/${variantId}`);
}

export function clearCartApi() {
  return api.delete("/cart");
}

// Wishlist API (Database-backed)
export function getWishlistApi() {
  return api.get("/wishlist");
}

export function toggleWishlistApi(productId) {
  return api.post("/wishlist/toggle", { productId });
}

export function clearWishlistApi() {
  return api.delete("/wishlist");
}

export function moveToBagApi(productId, variantId) {
  return api.post("/wishlist/move-to-bag", { productId, variantId });
}

