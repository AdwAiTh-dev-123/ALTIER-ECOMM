import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Address from "../../models/Address.js";
import { validateAndCalculateCoupon, markCouponAsUsed } from "./index.js";

export const processCodOrder = async ({
  userId,
  addressId,
  couponCode = null,
}) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const err = new Error("Delivery address not found.");
    err.statusCode = 404;
    throw err;
  }

  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.product",
      select: "name category isListed isDeleted",
    })
    .populate("items.variant");

  if (!cart || cart.items.length === 0) {
    const err = new Error("Your shopping bag is empty.");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const { product, variant, quantity } = item;
    if (!product || product.isDeleted || !product.isListed) {
      const err = new Error(
        `Product "${product?.name || "An item in your bag"}" is no longer available. Please update your bag.`,
      );
      err.statusCode = 400;
      throw err;
    }
    if (!variant || variant.isDeleted || !variant.isListed) {
      const err = new Error(
        `The selected style for "${product.name}" is no longer listed.`,
      );
      err.statusCode = 400;
      throw err;
    }
    if (variant.stock < quantity) {
      const err = new Error(
        `Insufficient stock for "${product.name}" (${variant.size}). Only ${variant.stock} left in stock.`,
      );
      err.statusCode = 400;
      throw err;
    }
    subtotal += variant.price * quantity;
    orderItems.push({
      product: product._id,
      variant: variant._id,
      title: product.name,
      color: variant.color,
      size: variant.size,
      image: variant.images?.[0] || "",
      price: variant.price,
      quantity,
      itemTotal: variant.price * quantity,
    });
  }

  const couponResult = await validateAndCalculateCoupon({
    couponCode,
    userId,
    cart,
  });
  const couponDiscount = couponResult.hasCoupon
    ? couponResult.discountAmount
    : 0;
  const shippingFee =
    subtotal - couponDiscount >= 1500 || subtotal >= 1500 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - couponDiscount) + shippingFee;
  // 3. Atomic stock decrement
  for (const item of orderItems) {
    const updated = await Variant.findOneAndUpdate(
      { _id: item.variant, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );
    if (!updated) {
      const err = new Error(
        "Inventory changed during checkout. Please review your bag.",
      );
      err.statusCode = 400;
      throw err;
    }
  }
  // 4. Mark coupon as used once order is placed
  if (couponResult.hasCoupon && couponResult.coupon?._id) {
    await markCouponAsUsed({
      couponId: couponResult.coupon._id,
      userId,
    });
  }
  const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const order = await Order.create({
    orderId,
    user: userId,
    items: orderItems,
    shippingAddress: {
      ...address.toObject(),
      country: address.country || "India",
    },
    pricing: {
      subtotal,
      shippingFee,
      couponDiscount,
      couponCode: couponResult.hasCoupon ? couponResult.coupon.code : null,
      totalAmount,
    },
    coupon: couponResult.hasCoupon ? couponResult.coupon._id : null,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
  });
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return order;
};
export default processCodOrder;
