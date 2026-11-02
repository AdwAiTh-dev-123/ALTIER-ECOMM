import Order from "../../models/Order.js";

export const recordPaymentFailure = async ({
  userId,
  orderId,
  errorDescription,
}) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(orderId);
  const query = {
    ...(isMongoId ? { $or: [{ orderId }, { _id: orderId }] } : { orderId }),
    user: userId,
  };

  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error("Order record not found");
    err.statusCode = 404;
    throw err;
  }

  // 1. Set paymentStatus to "Failed" (valid enum value in schema)
  order.paymentStatus = "Failed";

  // 2. Add history record without breaking orderStatus enum
  order.statusHistory.push({
    status: order.orderStatus || "Pending",
    timestamp: new Date(),
    comment: errorDescription || "Payment failed or dismissed by user",
    updatedBy: "Customer",
  });

  await order.save();
  return order;
};

export default recordPaymentFailure;
