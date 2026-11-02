import mongoose from "mongoose";

export const validateProductWithVariants = (req, res, next) => {
  const { name, variants } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Product name is required",
    });
  }

  const categoryId = req.body.categoryId || req.body.category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid category ID is required." });
  }
  req.body.categoryId = categoryId;
  req.body.category = categoryId;

  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({
      success: false,
      message: "A product must have at least one variant.",
    });
  }

  const validSizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (!v.color || !v.size || v.price === undefined || v.stock === undefined) {
      return res.status(400).json({
        success: false,
        message: `Variant #${i + 1} must include color, size, price, and stock.`,
      });
    }

    if (!validSizes.includes(v.size)) {
      return res.status(400).json({
        success: false,
        message: `Variant #${i + 1} size "${v.size}" is invalid. Allowed: ${validSizes.join(", ")}`,
      });
    }

    if (Number(v.price) < 10) {
      return res.status(400).json({
        success: false,
        message: `Variant #${i + 1} price must be at least ₹10.`,
      });
    }
    if (Number(v.stock) < 0 || !Number.isInteger(Number(v.stock))) {
      return res.status(400).json({
        success: false,
        message: `Variant #${i + 1} stock must be a non-negative integer.`,
      });
    }
  }
  req.body.name = name.trim();
  next();
};
