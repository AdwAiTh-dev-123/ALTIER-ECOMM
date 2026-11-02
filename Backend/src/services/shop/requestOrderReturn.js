import Order from "../../models/Order.js";

export const requestOrderReturn = async ({
  orderId,
  userId,
  reason,
  comment,
}) => {
  const order = await Order.findOne({ orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (order.orderStatus !== "Delivered") {
    const err = new Error(
      "Only delivered orders are eligible for return requests.",
    );
    err.statusCode = 400;
    throw err;
  }

  order.returnRequest = {
    isRequested: true,
    reason,
    comment: comment || "",
    status: "Pending",
    requestedAt: new Date(),
  };

  order.statusHistory.push({
    status: "Delivered",
    timestamp: new Date(),
    comment: `Return requested. Reason: ${reason}`,
    updatedBy: "Customer",
  });

  await order.save();
  return order;
};

export default requestOrderReturn;
