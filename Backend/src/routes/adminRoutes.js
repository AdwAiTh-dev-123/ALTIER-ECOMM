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
} = require("../controllers/admin/CategoryAdminController");

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.patch("/users/:id", toggleisBlocked);
router.get("/category", getAllCategories);
router.post("/category", createCategory);
router.patch("/category/:id", toggleCategoryListing);
router.delete("/category/:id", deleteCategory);

module.exports = router;
