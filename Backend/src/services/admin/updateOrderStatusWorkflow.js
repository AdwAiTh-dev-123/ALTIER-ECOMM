import Order from "../../models/Order.js";
import Variant from "../../models/Variant.js";
import { creditWalletRefund } from "../shop/walletService.js";

const ALLOWED_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
  "Return Requested": ["Returned", "Delivered"],
  Returned: [],
};

export const updateOrderStatusWorkflow = async ({ id, status, comment }) => {
  const order = await Order.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderId: id }],
  });

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = order.orderStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(status)) {
    const err = new Error(
      `Illegal transition from "${currentStatus}" to "${status}".`,
    );
    err.statusCode = 400;
    throw err;
  }

  if (status === "Cancelled" && currentStatus !== "Cancelled") {
    for (const item of order.items) {
      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity },
      });
    }
    order.cancellation = {
      reason: comment || "Cancelled by Administrator",
      cancelledAt: new Date(),
    };
    if (order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";

      await creditWalletRefund({
        userId: order.user,
        amount: order.pricing.totalAmount,
        orderId: order.orderId,
        reason: `Refund for order cancelled by Admin #${order.orderId}`,
      });
    }
  }

  if (status === "Returned" && currentStatus !== "Returned") {
    for (const item of order.items) {
      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity },
      });
    }
    if (orderPaymentStatus === "Paid") {
      order.paymentStatus = "Refunded";

      await creditWalletRefund({
        userId: order.user,
        amount: order.pricing.totalAmount,
        orderId: order.orderId,
        reason: `Refund for returned order #${order.orderId}`,
      });
    }
  }

  if (status === "Delivered" && order.paymentMethod === "COD") {
    order.paymentStatus = "Paid";
  }

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    comment:
      comment || `Status updated from ${currentStatus} to ${status} by Admin`,
    updatedBy: "Admin",
  });

  await order.save();
  return order;
};

export default updateOrderStatusWorkflow;
