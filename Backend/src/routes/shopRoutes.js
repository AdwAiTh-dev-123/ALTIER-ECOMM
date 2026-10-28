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

const router = express.Router();

router.get("/categories", getStorefrontCategories);
router.get("/products", getStorefrontProducts);
router.get("/products/:id", getStorefrontProductById);

router.get("/cart", authMiddleware, getCart);
router.post("/cart/add", authMiddleware, addToCart);
router.patch("/cart/update-quantity", authMiddleware, updateCartQuantity);
router.delete("/cart/item/:variantId", authMiddleware, removeFromCart);
router.delete("/cart", authMiddleware, clearCart);

router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist/toggle", authMiddleware, toggleWishlist);
router.delete("/wishlist", authMiddleware, clearWishlist);
router.post("/wishlist/move-to-bag", authMiddleware, moveToBag);

export default router;

