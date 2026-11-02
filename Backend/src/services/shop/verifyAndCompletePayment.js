import crypto from "crypto";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";

export const verifyAndCompletePayment = async ({
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  orderId,
}) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const expectedSignature = hmac.digest("hex");

  if (expectedSignature !== razorpaySignature) {
    const err = new Error("Invalid payment signature. Verification failed.");
    err.statusCode = 400;
    throw err;
  }

  const isMongoId = /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    ...(isMongoId ? { $or: [{ orderId }, { _id: orderId }] } : { orderId }),
    user: userId,
  });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (order.paymentStatus === "Paid" && order.orderStatus === "Confirmed") {
    return order;
  }

  // Decrement stock atomically
  for (const item of order.items) {
    const updated = await Variant.findOneAndUpdate(
      { _id: item.variant, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );
    if (!updated) {
      const err = new Error(
        "Stock changed before payment completion. Please contact support.",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  order.paymentStatus = "Paid";
  order.orderStatus = "Confirmed";
  order.razorpayDetails.paymentId = razorpayPaymentId;
  order.razorpayDetails.signature = razorpaySignature;
  order.statusHistory.push({
    status: "Confirmed",
    timestamp: new Date(),
    comment: `Payment verified successfully (ID: ${razorpayPaymentId})`,
    updatedBy: "System",
  });

  await order.save();
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

  return order;
};

export default verifyAndCompletePayment;
