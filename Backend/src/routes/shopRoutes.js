const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getStorefrontCategories,
  getStorefrontProductById,
  getStorefrontProducts,
} = require("../controllers/shop/shopProductController");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} = require("../controllers/shop/cartController");
const {
  getWishlist,
  toggleWishlist,
  moveToBag,
  clearWishlist,
} = require("../controllers/shop/wishlistController");

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

module.exports = router;

