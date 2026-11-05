export const validateApplyCoupon = (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode || typeof couponCode !== "string" || !couponCode.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid coupon code",
    });
  }

  const trimmed = couponCode.trim();

  if (trimmed.length < 3 || trimmed.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Coupon code must be between 3 and 20 characters",
    });
  }

  req.body.couponCode = trimmed.toUpperCase();
  next();
};
