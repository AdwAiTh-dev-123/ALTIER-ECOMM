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

export function getAddressesApi() {
  return api.get("/addresses");
}

export function addAddressApi(addressData) {
  return api.post("/addresses", addressData);
}

export function updateAddressApi(id, addressData) {
  return api.put(`/addresses/${id}`, addressData);
}

export function deleteAddressApi(id) {
  return api.delete(`/addresses/${id}`);
}

export function setDefaultAddressApi(id) {
  return api.patch(`/addresses/${id}/default`);
}

export function placeCodOrderApi({ addressId, couponCode = null }) {
  return api.post("/orders/cod", { addressId, couponCode });
}

export function getOrderByIdApi(orderId) {
  return api.get(`/orders/${orderId}`);
}

export function createRazorpayOrderApi({
  addressId,
  retryOrderId,
  couponCode = null,
}) {
  return api.post("/orders/razorpay/create", {
    addressId,
    retryOrderId,
    couponCode,
  });
}

export function verifyRazorpayPaymentApi(paymentPayload) {
  return api.post("/orders/razorpay/verify", paymentPayload);
}

export function recordPaymentFailureApi({ orderId, reason }) {
  return api.post("/orders/razorpay/fail", { orderId, reason });
}

export function getUserOrdersApi(params = {}) {
  return api.get("/orders", { params });
}

export function cancelOrderApi(orderId, { reason }) {
  return api.patch(`/orders/${orderId}/cancel`, { reason });
}

export function requestReturnApi(orderId, { reason }) {
  return api.post(`/orders/${orderId}/return`, { reason });
}

export function getWalletApi() {
  return api.get("/wallet");
}

export function createWalletTopupOrderApi(amount) {
  return api.post("/wallet/topup/create", { amount });
}

export function verifyWalletTopupApi(payload) {
  return api.post("/wallet/topup/verify", payload);
}
export function placeWalletOrderApi({ addressId, couponCode = null }) {
  return api.post("/orders/wallet", { addressId, couponCode });
}

export function cancelOrderItemApi(orderId, itemId, { reason }) {
  return api.patch(`/orders/${orderId}/items/${itemId}/cancel`, { reason });
}

export function requestOrderItemReturnApi(
  orderId,
  itemId,
  { reason, comment },
) {
  return api.post(`/orders/${orderId}/items/${itemId}/return`, {
    reason,
    comment,
  });
}

export function applyCouponApi(couponCode) {
  return api.post("/coupons/apply", { couponCode });
}
