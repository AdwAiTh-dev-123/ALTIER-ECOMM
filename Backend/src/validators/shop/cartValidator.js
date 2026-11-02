import mongoose from "mongoose";

export const validateAddToCart = (req, res, next) => {
  const { productId, variantId, quantity } = req.body;
  if (!productId || !variantId) {
    return res.status(400).json({
      success: false,
      message: "Product ID and Variant ID are required.",
    });
  }

  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(variantId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid product or variant id.",
    });
  }

  if (quantity !== undefined) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer between 1 and 10.",
      });
    }
    req.body.quantity = qty;
  }
  next();
};

export const validateUpdateCartQuantity = (req, res, next) => {
  const { variantId, quantity } = req.body;
  if (!variantId || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Variant ID and target quantity are required.",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid variant ID.",
    });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be between 1 and 10.",
    });
  }

  req.body.quantity = qty;
  next();
};
