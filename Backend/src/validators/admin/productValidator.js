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
  const seenVariants = new Set();

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

    const comboKey = `${v.color.trim().toLowerCase()}_${v.size.trim().toUpperCase()}`;
    if (seenVariants.has(comboKey)) {
      return res.status(400).json({
        success: false,
        message: `Duplicate variant detected: Color "${v.color}" with Size "${v.size}" is added more than once. Each variant must have a unique color and size combination.`,
      });
    }
    seenVariants.add(comboKey);
  }
  req.body.name = name.trim();
  next();
};
