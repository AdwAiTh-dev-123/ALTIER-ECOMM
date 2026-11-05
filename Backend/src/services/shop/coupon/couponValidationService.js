import Coupon from "../../../models/Coupon.js";
import Cart from "../../../models/Cart.js";

export const validateAndCalculateCoupon = async ({
  couponCode,
  userId,
  cart: passedCart,
}) => {
  if (!couponCode) {
    return {
      hasCoupon: false,
      coupon: null,
      discountAmount: 0,
    };
  }

  const normalizedCode = couponCode.trim().toUpperCase();

  // 1. Fetch coupon
  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
    isDeleted: false,
  });

  if (!coupon) {
    const err = new Error(
      `Coupon "${normalizedCode}" is invalid or does not exist.`,
    );
    err.statusCode = 404;
    throw err;
  }

  // 2. Business Check: Validity Dates
  const now = new Date();
  if (now < new Date(coupon.startDate)) {
    const err = new Error(`Coupon "${normalizedCode}" is not active yet.`);
    err.statusCode = 400;
    throw err;
  }

  if (now > new Date(coupon.endDate)) {
    const err = new Error(`Coupon "${normalizedCode}" has expired.`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Business Check: Single-Use per User
  const alreadyUsed = coupon.usedBy.some(
    (id) => id.toString() === userId.toString(),
  );
  if (alreadyUsed) {
    const err = new Error(`You have already used coupon "${normalizedCode}"`);
    err.statusCode = 400;
    throw err;
  }

  // 4. Fetch Cart with product category
  let cart = passedCart;
  if (!cart) {
    cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name category isListed isDeleted",
      })
      .populate("items.variant");
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    const err = new Error("Your shopping bag is empty.");
    err.statusCode = 400;
    throw err;
  }

  // 5. Calculate Eligible Subtotal
  let totalSubtotal = 0;
  let eligibleSubtotal = 0;

  const hasCatRestriction = coupon.applicableCategories?.length > 0;
  const hasProdRestriction = coupon.applicableProducts?.length > 0;
  const isRestricted =
    coupon.applicabilityType !== "ALL" &&
    (hasCatRestriction || hasProdRestriction);

  for (const item of cart.items) {
    const product = item.product;
    const variant = item.variant;

    if (!variant || !product || variant.isDeleted || !variant.isListed) {
      continue;
    }

    const itemTotal = variant.price * item.quantity;
    totalSubtotal += itemTotal;

    if (!isRestricted) {
      eligibleSubtotal += itemTotal;
    } else {
      const matchProduct =
        hasProdRestriction &&
        coupon.applicableProducts.some(
          (pId) => pId.toString() === product._id.toString(),
        );
      const matchCategory =
        hasCatRestriction &&
        product.category &&
        coupon.applicableCategories.some(
          (cId) => cId.toString() === product.category.toString(),
        );

      if (matchProduct || matchCategory) {
        eligibleSubtotal += itemTotal;
      }
    }
  }

  // 6. Minimum Spend Check
  if (
    coupon.minPurchaseAmount > 0 &&
    totalSubtotal < coupon.minPurchaseAmount
  ) {
    const err = new Error(
      `Coupon "${normalizedCode}" requires a minimum subtotal of ₹${coupon.minPurchaseAmount}.`,
    );
    err.statusCode = 400;
    throw err;
  }

  if (eligibleSubtotal === 0) {
    const err = new Error(
      `Coupon "${normalizedCode}" is not applicable to any items in your bag.`,
    );
    err.statusCode = 400;
    throw err;
  }

  // 7. Calculate Discount Amount
  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    const calculated = Math.round(
      (eligibleSubtotal * coupon.discountValue) / 100,
    );
    discountAmount =
      coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0
        ? Math.min(calculated, coupon.maxDiscountAmount)
        : calculated;
  } else {
    discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
  }

  return {
    hasCoupon: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    },
    discountAmount,
    eligibleSubtotal,
    totalSubtotal,
  };
};

export const markCouponAsUsed = async ({ couponId, userId }) => {
  if (!couponId || !userId) return;
  await Coupon.findByIdAndUpdate(couponId, {
    $addToSet: { usedBy: userId },
    $inc: { usedCount: 1 },
  });
};
