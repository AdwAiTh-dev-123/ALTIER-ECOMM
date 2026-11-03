import Order from "../../models/Order.js";

export const requestOrderItemReturn = async ({
  orderId,
  itemId,
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

  const item = order.items.id(itemId);
  if (!item) {
    const err = new Error("Item not found in this order.");
    err.statusCode = 404;
    throw err;
  }

  if (item.status === "Cancelled" || item.status === "Returned") {
    const err = new Error(`Item cannot be returned (current status: ${item.status}).`);
    err.statusCode = 400;
    throw err;
  }

  if (item.returnRequest && item.returnRequest.status === "Pending") {
    const err = new Error("A return request is already pending for this item.");
    err.statusCode = 400;
    throw err;
  }

  item.status = "Return Requested";
  item.returnRequest = {
    reason,
    comment: comment || null,
    status: "Pending",
    requestedAt: new Date(),
    adminNote: null,
  };

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    comment: `Return requested for item "${item.title}" (${item.color}/${item.size}). Reason: ${reason}`,
    updatedBy: "Customer",
  });

  await order.save();
  return order;
};

export default requestOrderItemReturn;