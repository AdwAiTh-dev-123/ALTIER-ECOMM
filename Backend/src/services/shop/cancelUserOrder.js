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

  if (order.orderStatus === "Confirmed") {
    for (const item of order.items) {
      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity },
      });
    }
  }

  order.orderStatus = "Cancelled";
  order.cancellation = {
    reason: reason || "Cancelled by customer",
    cancelledAt: new Date(),
  };

  if (order.paymentStatus === "Paid") {
    order.paymentStatus = "Refunded";

    await creditWalletRefund({
      userId: order.user,
      amount: order.pricing.totalAmount,
      orderId: order.orderId,
      reason: `Refund for cancelled order #${order.orderId}`,
    });
  }

  order.statusHistory.push({
    status: "Cancelled",
    timestamp: new Date(),
    comment: reason || "Order cancelled by customer",
    updatedBy: "Customer",
  });

  await order.save();
  return order;
};

export default cancelUserOrder;
