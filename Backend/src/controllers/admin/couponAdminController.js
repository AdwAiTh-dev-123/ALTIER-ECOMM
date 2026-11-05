import {
  createNewCoupon,
  fetchAllCoupons,
  toggleCouponActiveStatus,
  softDeleteCoupon,
} from "../../services/admin/index.js";

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await createNewCoupon(req.body);
    return res.status(201).json({
      success: true,
      message: `Coupon "${coupon.code}" created successfully!`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const result = await fetchAllCoupons(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await toggleCouponActiveStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? "Active" : "Inactive"}.`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await softDeleteCoupon(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully.`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};
