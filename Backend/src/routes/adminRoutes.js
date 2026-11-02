import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import multer from "multer";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";
import {
  getAllUsers,
  toggleUserBlock,
} from "../controllers/admin/userAdminController.js";
import {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
  updateCategory,
} from "../controllers/admin/categoryAdminController.js";
import {
  createProductWithVariants,
  getAllProducts,
  toggleProductListing,
  updateProductWithVariants,
  deleteProduct,
} from "../controllers/admin/productAdminController.js";
import {
  getAllAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  reviewReturnRequest,
} from "../controllers/admin/orderAdminController.js";
import {
  validateCategoryInput,
  validateCategoryIdParam,
  validateProductWithVariants,
  validateOrderStatusUpdate,
  validateReturnReview,
} from "../validators/admin/index.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Unsupported file format. Please upload JPG, PNG, or WebP images.",
      );
      error.statusCode = 400;
      cb(error, false);
    }
  },
});

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.patch("/users/:id", toggleUserBlock);

router.get("/category", getAllCategories);
router.post("/category", validateCategoryInput, createCategory);
router.put(
  "/category/:id",
  validateCategoryIdParam,
  validateCategoryInput,
  updateCategory,
);
router.patch("/category/:id", validateCategoryIdParam, toggleCategoryListing);
router.delete("/category/:id", validateCategoryIdParam, deleteCategory);

router.get("/products", getAllProducts);
router.post(
  "/products",
  validateProductWithVariants,
  createProductWithVariants,
);
router.put(
  "/products/:id",
  validateProductWithVariants,
  updateProductWithVariants,
);
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

//order management
router.get("/orders", getAllAdminOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch(
  "/orders/:id/status",
  validateOrderStatusUpdate,
  updateOrderStatus,
);
router.patch(
  "/orders/:id/return-review",
  validateReturnReview,
  reviewReturnRequest,
);

export default router;
