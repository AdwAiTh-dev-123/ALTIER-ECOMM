import { razorpayInstance } from "../../config/razorpay.js";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Address from "../../models/Address.js";

const generateOrderId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

export const initiateRazorpayOrder = async ({
  userId,
  addressId,
  retryOrderId,
}) => {
  let address;
  let orderItems = [];
  let subtotal = 0;
  let existingOrder = null;

  if (retryOrderId) {
    existingOrder = await Order.findOne({
      orderId: retryOrderId,
      user: userId,
    });
    if (!existingOrder) {
      const err = new Error("Original order record not found for retry.");
      err.statusCode = 404;
      throw err;
    }
    if (existingOrder.paymentStatus === "Paid") {
      const err = new Error("This order is already paid.");
      err.statusCode = 400;
      throw err;
    }

    orderItems = existingOrder.items;
    subtotal = existingOrder.pricing.subtotal;

    for (const item of orderItems) {
      const variant = await Variant.findById(item.variant);
      if (
        !variant ||
        variant.isDeleted ||
        !variant.isListed ||
        variant.stock < item.quantity
      ) {
        const err = new Error(
          `Cannot retry: "${item.title}" is no longer in stock.`,
        );
        err.statusCode = 400;
        throw err;
      }
    }
  } else {
    address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      const err = new Error("Delivery address not found.");
      err.statusCode = 404;
      throw err;
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant");

    if (!cart || cart.items.length === 0) {
      const err = new Error("Your shopping bag is empty.");
      err.statusCode = 400;
      throw err;
    }

    for (const item of cart.items) {
      const { product, variant, quantity } = item;
      if (
        !variant ||
        !product ||
        variant.isDeleted ||
        !variant.isListed ||
        product.isDeleted ||
        !product.isListed
      ) {
        const err = new Error(
          "One or more items in your cart are no longer available.",
        );
        err.statusCode = 400;
        throw err;
      }

      if (variant.stock < quantity) {
        const err = new Error(
          `Insufficient stock for "${product.name}". Only ${variant.stock} left.`,
        );
        err.statusCode = 400;
        throw err;
      }

      const itemTotal = variant.price * quantity;
      subtotal += itemTotal;
      orderItems.push({
        product: product._id,
        variant: variant._id,
        title: product.name,
        color: variant.color,
        size: variant.size,
        image: variant.images?.[0] || "",
        price: variant.price,
        quantity,
        itemTotal,
      });
    }
  }

  const shippingFee = subtotal >= 1500 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  const rzpOrder = await razorpayInstance.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: existingOrder ? existingOrder.orderId : generateOrderId(),
  });

  let finalOrder;
  if (existingOrder) {
    existingOrder.razorpayDetails.orderId = rzpOrder.id;
    existingOrder.paymentStatus = "Pending";
    existingOrder.statusHistory.push({
      status: "Pending",
      timestamp: new Date(),
      comment: `Payment retry initiated (Razorpay Order: ${rzpOrder.id})`,
      updatedBy: "Customer",
    });
    finalOrder = await existingOrder.save();
  } else {
    finalOrder = await Order.create({
      orderId: rzpOrder.receipt,
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.streetAddress,
        apartment: address.apartment || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || "India",
      },
      pricing: { subtotal, shippingFee, totalAmount },
      paymentMethod: "RAZORPAY",
      paymentStatus: "Pending",
      orderStatus: "Pending",
      razorpayDetails: { orderId: rzpOrder.id },
      statusHistory: [
        {
          status: "Pending",
          timestamp: new Date(),
          comment: "Razorpay payment initiated",
          updatedBy: "Customer",
        },
      ],
    });
  }

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    orderId: finalOrder.orderId,
  };
};

export default initiateRazorpayOrder;
