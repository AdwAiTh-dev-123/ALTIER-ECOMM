import mongoose from "mongoose";

export const validateCreateCoupon = (req, res, next) => {
  const {
    code,
    discountType,
    discountValue,
    startDate,
    endDate,
    minPurchaseAmount,
    maxDiscountAmount,
    applicabilityType = "ALL",
    applicableCategories = [],
    applicableProducts = [],
  } = req.body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({
      success: false,
      message: "Coupon code is required.",
    });
  }

  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length < 3 || cleanCode.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Coupon code must be between 3 and 20 characters.",
    });
  }

  if (!["PERCENTAGE", "FLAT"].includes(discountType)) {
    return res.status(400).json({
      success: false,
      message: "Discount type must be either 'PERCENTAGE' or 'FLAT'.",
    });
  }

  const numDiscountValue = Number(discountValue);
  if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Discount value must be a positive number greater than 0.",
    });
  }
  if (
    discountType === "PERCENTAGE" &&
    (numDiscountValue < 1 || numDiscountValue > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Percentage discount must be between 1% and 100%.",
    });
  }

  if (!startDate || isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      message: "A valid start date is required.",
    });
  }
  if (!endDate || isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      message: "A valid end date is required.",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: "End date must be after the start date.",
    });
  }

  if (minPurchaseAmount !== undefined && minPurchaseAmount !== null) {
    const minVal = Number(minPurchaseAmount);
    if (isNaN(minVal) || minVal < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum purchase amount must be 0 or higher.",
      });
    }
    req.body.minPurchaseAmount = minVal;
  }

  if (
    maxDiscountAmount !== undefined &&
    maxDiscountAmount !== null &&
    maxDiscountAmount !== ""
  ) {
    const maxVal = Number(maxDiscountAmount);
    if (isNaN(maxVal) || maxVal < 0) {
      return res.status(400).json({
        success: false,
        message: "Max discount amount must be 0 or higher.",
      });
    }
    req.body.maxDiscountAmount = maxVal;
  } else {
    req.body.maxDiscountAmount = null;
  }
  // 5. Validate Scope & Restrictions (Optional - defaults to ALL if omitted)
  if (!["ALL", "CATEGORY", "PRODUCT"].includes(applicabilityType)) {
    return res.status(400).json({
      success: false,
      message: "Applicability type must be 'ALL', 'CATEGORY', or 'PRODUCT'.",
    });
  }
  if (Array.isArray(applicableCategories)) {
    for (const catId of applicableCategories) {
      if (!mongoose.Types.ObjectId.isValid(catId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category ID: ${catId}`,
        });
      }
    }
  }
  if (Array.isArray(applicableProducts)) {
    for (const prodId of applicableProducts) {
      if (!mongoose.Types.ObjectId.isValid(prodId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${prodId}`,
        });
      }
    }
  }

  req.body.code = cleanCode;
  req.body.discountValue = numDiscountValue;
  req.body.startDate = start;
  req.body.endDate = end;
  next();
};
export const validateCouponIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon ID format.",
    });
  }
  next();
};
