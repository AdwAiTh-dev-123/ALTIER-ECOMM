const express = require("express");
const router = express.Router();
const {
  getStorefrontCategories,
  getStorefrontProductById,
  getStorefrontProducts,
} = require("../controllers/shop/shopProductController");

router.get("/categories", getStorefrontCategories);
router.get("/products", getStorefrontProducts);
router.get("/products/:id", getStorefrontProductById);

module.exports = router;
