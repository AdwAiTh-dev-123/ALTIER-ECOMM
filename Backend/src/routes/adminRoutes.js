import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import multer from "multer";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";
import {
  getAllUsers,
  toggleisBlocked,
} from "../controllers/admin/userAdminController.js";
import {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
  updateCategory,
} from "../controllers/admin/CategoryAdminController.js";
import {
  createProductWithVariants,
  getAllProducts,
  toggleProductListing,
  updateProductWithVariants,
  deleteProduct,
} from "../controllers/admin/productAdminController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

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

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const secureUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "altier/products",
    );
    return res.status(200).json({
      success: true,
      url: secureUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
