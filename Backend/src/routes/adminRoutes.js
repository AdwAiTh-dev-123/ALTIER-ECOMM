const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");
const {
  getAllUsers,
  toggleisBlocked,
} = require("../controllers/admin/userAdminController");
const {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
  updateCategory,
} = require("../controllers/admin/CategoryAdminController");

const {
  createProductWithVariants,
  getAllProducts,
  toggleProductListing,
  updateProductWithVariants,
  deleteProduct,
} = require("../controllers/admin/productAdminController");

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.patch("/users/:id", toggleisBlocked);

router.get("/category", getAllCategories);
router.post("/category", createCategory);
router.put("/category/:id", updateCategory);
router.patch("/category/:id", toggleCategoryListing);
router.delete("/category/:id", deleteCategory);

router.get("/products", getAllProducts);
router.post("/products", createProductWithVariants);
router.put("/products/:id", updateProductWithVariants);
router.patch("/products/:id", toggleProductListing);
router.delete("/products/:id", deleteProduct);

module.exports = router;
