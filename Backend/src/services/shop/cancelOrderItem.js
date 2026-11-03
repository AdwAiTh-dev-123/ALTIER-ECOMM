import Order from "../../models/Order.js";
import Variant from "../../models/Variant.js";
import { creditWalletRefund } from "./walletService.js";

export const cancelOrderItem = async ({ orderId, itemId, userId, reason }) => {
  const order = await Order.findOne({ orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus)) {
    const err = new Error(
      `Items cannot be cancelled once the order is ${order.orderStatus.toLowerCase()}.`,
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
  if (item.status === "Cancelled") {
    const err = new Error("This item has already been cancelled.");
    err.statusCode = 400;
    throw err;
  }

  if (order.orderStatus === "Confirmed") {
    await Variant.findByIdAndUpdate(item.variant, {
      $inc: { stock: item.quantity },
    });
  }

  item.status = "Cancelled";
  item.cancellation = {
    reason: reason || "Cancelled by customer",
    cancelledAt: new Date(),
  };

  const isPaid =
    order.paymentStatus === "Paid" ||
    order.paymentStatus === "Partially Refunded";
  if (isPaid) {
    await creditWalletRefund({
      userId: order.user,
      amount: item.itemTotal,
      orderId: order.orderId,
      reason: `Refund for cancelled item (${item.title} - ${item.size}) in Order #${order.orderId}`,
    });
  }

  const activeItems = order.items.filter((i) => i.status !== "Cancelled");
  if (activeItems.length === 0) {
    order.orderStatus = "Cancelled";
    order.cancellation = {
      reason: "All items in order were cancelled",
      cancelledAt: new Date(),
    };

    if (isPaid && order.pricing.shippingFee > 0) {
      await creditWalletRefund({
        userId: order.user,
        amount: order.pricing.shippingFee,
        orderId: order.orderId,
        reason: `Refund for shipping fee on cancelled Order #${order.orderId}`,
      });
    }
    order.paymentStatus = isPaid ? "Refunded" : order.paymentStatus;
  } else if (isPaid) {
    order.paymentStatus = "Partially Refunded";
  }

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    comment: `Item "${item.title}" (${item.color}/${item.size}) cancelled by customer. Reason: ${reason || "N/A"}`,
    updatedBy: "Customer",
  });
  await order.save();
  return order;
};

export default cancelOrderItem;
