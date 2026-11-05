import { validateAndCalculateCoupon } from "../../services/shop/index.js";

export const applyCouponCode = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user._id;

    const result = await validateAndCalculateCoupon({
      couponCode,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: `Coupon "${result.coupon.code}" applied successfully!`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
