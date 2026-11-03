import Order from "../../models/Order.js";
import Variant from "../../models/Variant.js";
import { creditWalletRefund } from "./walletService.js";

export const cancelUserOrder = async ({ orderId, userId, reason }) => {
  const order = await Order.findOne({ orderId, user: userId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus)) {
    const err = new Error(
      `Order cannot be cancelled in its current state (${order.orderStatus}).`,
    );
    err.statusCode = 400;
    throw err;
  }

  let remainingRefundAmount = 0;
  const isPaid =
    order.paymentStatus === "Paid" ||
    order.paymentStatus === "Partially Refunded";

  for (const item of order.items) {
    if (item.status !== "Cancelled") {
      if (order.orderStatus === "Confirmed") {
        await Variant.findByIdAndUpdate(item.variant, {
          $inc: { stock: item.quantity },
        });
      }

      remainingRefundAmount += item.itemTotal;
      item.status = "Cancelled";
      item.cancellation = {
        reason: reason || "Cancelled as part of whole order cancellation",
        cancelledAt: new Date(),
      };
    }
  }

  if (isPaid && order.pricing.shippingFee > 0) {
    remainingRefundAmount += order.pricing.shippingFee;
  }

  if (isPaid && remainingRefundAmount > 0) {
    await creditWalletRefund({
      userId: order.user,
      amount: remainingRefundAmount,
      orderId: order.orderId,
      reason: `Refund for cancelled order #${order.orderId}`,
    });
    order.paymentStatus = "Refunded";
  }

  order.orderStatus = "Cancelled";
  order.cancellation = {
    reason: reason || "Cancelled by customer",
    cancelledAt: new Date(),
  };

  order.statusHistory.push({
    status: "Cancelled",
    timestamp: new Date(),
    comment: reason || "Entire order cancelled by customer",
    updatedBy: "Customer",
  });

  await order.save();
  return order;
};

export default cancelUserOrder;
