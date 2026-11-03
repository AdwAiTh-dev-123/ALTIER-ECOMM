import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getStorefrontCategories,
  getStorefrontProductById,
  getStorefrontProducts,
} from "../controllers/shop/shopProductController.js";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "../controllers/shop/cartController.js";
import {
  getWishlist,
  toggleWishlist,
  moveToBag,
  clearWishlist,
} from "../controllers/shop/wishlistController.js";
import {
  addAddress,
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/shop/addressController.js";
import {
  createCodOrder,
  getOrderById,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayFailure,
  getUserOrders,
  cancelOrder,
  requestReturn,
  cancelItemInOrder,
  requestItemReturnInOrder,
} from "../controllers/shop/orderController.js";

import {
  validateAddressInput,
  validateAddressIdParam,
  validateAddToCart,
  validateUpdateCartQuantity,
  validateCodOrder,
  validateRazorpayVerify,
  validateReturnRequest,
} from "../validators/shop/index.js";
import {
  getWallet,
  createWalletTopupOrder,
  verifyWalletTopup,
  createWalletOrder,
} from "../controllers/shop/walletController.js";

const router = express.Router();

router.get("/categories", getStorefrontCategories);
router.get("/products", getStorefrontProducts);
router.get("/products/:id", getStorefrontProductById);

//cart
router.get("/cart", authMiddleware, getCart);
router.post("/cart/add", authMiddleware, validateAddToCart, addToCart);
router.patch(
  "/cart/update-quantity",
  authMiddleware,
  validateUpdateCartQuantity,
  updateCartQuantity,
);
router.delete("/cart/item/:variantId", authMiddleware, removeFromCart);
router.delete("/cart", authMiddleware, clearCart);

//wishlist
router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist/toggle", authMiddleware, toggleWishlist);
router.delete("/wishlist", authMiddleware, clearWishlist);
router.post("/wishlist/move-to-bag", authMiddleware, moveToBag);

//address
router.get("/addresses", authMiddleware, getUserAddresses);
router.post("/addresses", authMiddleware, validateAddressInput, addAddress);
router.put(
  "/addresses/:id",
  authMiddleware,
  validateAddressIdParam,
  validateAddressInput,
  updateAddress,
);
router.delete(
  "/addresses/:id",
  authMiddleware,
  validateAddressIdParam,
  deleteAddress,
);
router.patch(
  "/addresses/:id/default",
  authMiddleware,
  validateAddressIdParam,
  setDefaultAddress,
);

//Orders
router.get("/orders", authMiddleware, getUserOrders);
router.post("/orders/cod", authMiddleware, validateCodOrder, createCodOrder);
router.get("/orders/:id", authMiddleware, getOrderById);
router.patch("/orders/:id/cancel", authMiddleware, cancelOrder);
router.post(
  "/orders/:id/return",
  authMiddleware,
  validateReturnRequest,
  requestReturn,
);
router.patch(
  "/orders/:orderId/items/:itemId/cancel",
  authMiddleware,
  cancelItemInOrder,
);
router.post(
  "/orders/:orderId/items/:itemId/return",
  authMiddleware,
  validateReturnRequest,
  requestItemReturnInOrder,
);
router.post("/orders/razorpay/create", authMiddleware, createRazorpayOrder);
router.post(
  "/orders/razorpay/verify",
  authMiddleware,
  validateRazorpayVerify,
  verifyRazorpayPayment,
);
router.post("/orders/razorpay/fail", authMiddleware, handleRazorpayFailure);

//wallet
router.get("/wallet", authMiddleware, getWallet);
router.post("/wallet/topup/create", authMiddleware, createWalletTopupOrder);
router.post("/wallet/topup/verify", authMiddleware, verifyWalletTopup);
router.post("/orders/wallet", authMiddleware, createWalletOrder);

export default router;
