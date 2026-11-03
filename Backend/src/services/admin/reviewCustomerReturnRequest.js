import Order from "../../models/Order.js";
import Variant from "../../models/Variant.js";
import { creditWalletRefund } from "../shop/walletService.js";

export const reviewCustomerReturnRequest = async ({
  id,
  decision,
  adminNotes,
}) => {
  const order = await Order.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderId: id }],
  });

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  const isApproved = decision.toUpperCase().startsWith("APPROV");

  if (isApproved) {
    order.orderStatus = "Returned";
    order.returnRequest = {
      ...order.returnRequest,
      status: "Approved",
      reviewedAt: new Date(),
      adminNote: adminNotes || "Return approved by Admin",
    };
    for (const item of order.items) {
      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity },
      });
    }
    if (order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";

      await creditWalletRefund({
        userId: order.user,
        amount: order.pricing.totalAmount,
        orderId: order.orderId,
        reason: `Refund for returned order #${order.orderId}`,
      });
    }
  } else {
    order.orderStatus = "Delivered";
    order.returnRequest = {
      ...order.returnRequest,
      status: "Rejected",
      reviewedAt: new Date(),
      adminNote: adminNotes || "Return rejected by Admin",
    };
  }

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    comment: `Return ${isApproved ? "approved" : "rejected"} by Admin. Note: ${adminNotes || "N/A"}`,
    updatedBy: "Admin",
  });

  await order.save();
  return order;
};

export default reviewCustomerReturnRequest;
