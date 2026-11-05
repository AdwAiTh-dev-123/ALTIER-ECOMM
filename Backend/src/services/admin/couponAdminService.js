import Coupon from "../../models/Coupon.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";


export const createNewCoupon = async ({
  code,
  description = "",
  discountType,
  discountValue,
  maxDiscountAmount = null,
  minPurchaseAmount = 0,
  startDate,
  endDate,
  applicabilityType = "ALL",
  applicableCategories = [],
  applicableProducts = [],
}) => {
  const normalizedCode = code.trim().toUpperCase();

  // Check for duplicate code among non-deleted coupons
  const existing = await Coupon.findOne({
    code: normalizedCode,
    isDeleted: false,
  });

  if (existing) {
    const err = new Error(
      `Coupon with code "${normalizedCode}" already exists.`,
    );
    err.statusCode = 409;
    throw err;
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    description: description.trim(),
    discountType,
    discountValue,
    maxDiscountAmount: discountType === "PERCENTAGE" ? maxDiscountAmount : null,
    minPurchaseAmount,
    startDate,
    endDate,
    applicabilityType,
    applicableCategories:
      applicabilityType === "CATEGORY" || applicabilityType === "ALL"
        ? applicableCategories
        : [],
    applicableProducts:
      applicabilityType === "PRODUCT" || applicabilityType === "ALL"
        ? applicableProducts
        : [],
    isActive: true,
    isDeleted: false,
  });

  return coupon;
};


export const fetchAllCoupons = async (query = {}) => {
  const { skip, limit } = getPagination(query, 10);
  const filter = { isDeleted: false };

  // Search by code
  if (query.search?.trim()) {
    filter.code = { $regex: query.search.trim().toUpperCase(), $options: "i" };
  }

  const now = new Date();

  // Status filtering
  if (query.status === "active") {
    filter.isActive = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  } else if (query.status === "inactive") {
    filter.isActive = false;
  } else if (query.status === "expired") {
    filter.endDate = { $lt: now };
  }

  const [total, coupons, totalCoupons, activeCoupons, expiredCoupons] =
    await Promise.all([
      Coupon.countDocuments(filter),
      Coupon.find(filter)
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments({ isDeleted: false }),
      Coupon.countDocuments({
        isDeleted: false,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Coupon.countDocuments({ isDeleted: false, endDate: { $lt: now } }),
    ]);

  return formatPaginatedResponse(coupons, total, query.page, limit, {
    stats: {
      total: totalCoupons,
      active: activeCoupons,
      expired: expiredCoupons,
    },
  });
};


export const toggleCouponActiveStatus = async (couponId) => {
  const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });
  if (!coupon) {
    const err = new Error("Coupon not found.");
    err.statusCode = 404;
    throw err;
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  return coupon;
};


export const softDeleteCoupon = async (couponId) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true },
  );

  if (!coupon) {
    const err = new Error("Coupon not found.");
    err.statusCode = 404;
    throw err;
  }

  return coupon;
};
