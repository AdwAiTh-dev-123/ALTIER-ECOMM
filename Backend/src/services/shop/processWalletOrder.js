import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Address from "../../models/Address.js";
import Wallet from "../../models/Wallet.js";
import { getOrCreateWallet } from "./walletService.js";
import { validateAndCalculateCoupon, markCouponAsUsed } from "./index.js";

export const processWalletOrder = async ({
  userId,
  addressId,
  couponCode = null,
}) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const err = new Error("Delivery address not found");
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
    const err = new Error("Your shipping bag is empty");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  let subtotal = 0;

  // Real-time product & variant condition check
  for (const item of cart.items) {
    const { product, variant, quantity } = item;
    if (!product || product.isDeleted || !product.isListed) {
      const err = new Error(
        `Item "${product?.name || "Selected garment"}" is no longer available.`,
      );
      err.statusCode = 400;
      throw err;
    }
    if (
      !variant ||
      variant.isDeleted ||
      !variant.isListed ||
      variant.stock < quantity
    ) {
      const err = new Error(
        `Item "${product.name}" is unavailable or has insufficient stock.`,
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

  // Coupon evaluation
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

  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < totalAmount) {
    const err = new Error(
      `Insufficient wallet balance. Total is ₹${totalAmount}, but your wallet has ₹${wallet.balance}.`,
    );
    err.statusCode = 400;
    throw err;
  }

  const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Deduct from wallet atomically
  const debitedWallet = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: totalAmount } },
    {
      $inc: { balance: -totalAmount },
      $push: {
        transactions: {
          type: "DEBIT",
          amount: totalAmount,
          description: `Payment for Order ${orderId}`,
          orderId,
          createdAt: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!debitedWallet) {
    const err = new Error(
      "Failed to debit wallet. Please ensure balance is sufficient.",
    );
    err.statusCode = 400;
    throw err;
  }

  // Atomic stock decrement
  for (const item of orderItems) {
    const updated = await Variant.findOneAndUpdate(
      { _id: item.variant, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );
    if (!updated) {
      // Revert wallet on failure
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: totalAmount },
          $push: {
            transactions: {
              type: "CREDIT",
              amount: totalAmount,
              description: `Refund: Checkout stock changed for Order ${orderId}`,
              orderId,
              createdAt: new Date(),
            },
          },
        },
      );
      const err = new Error(
        "Stock changed during payment. Your wallet has been refunded.",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Mark coupon as used
  if (couponResult.hasCoupon && couponResult.coupon?._id) {
    await markCouponAsUsed({
      couponId: couponResult.coupon._id,
      userId,
    });
  }

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
    paymentMethod: "WALLET",
    paymentStatus: "Paid",
    orderStatus: "Confirmed",
  });

  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return order;
};

export default processWalletOrder;
