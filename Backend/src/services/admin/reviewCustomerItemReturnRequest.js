import Order from "../../models/Order.js";
import Variant from "../../models/Variant.js";
import { creditWalletRefund } from "../shop/walletService.js";

export const reviewCustomerItemReturnRequest = async ({
  orderId,
  itemId,
  decision,
  adminNotes,
}) => {
  const order = await Order.findOne({
    $or: [
      { _id: orderId && orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
      { orderId },
    ],
  });

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  const item = order.items.id(itemId);
  if (!item) {
    const err = new Error("Item not found in this order.");
    err.statusCode = 404;
    throw err;
  }

  if (
    item.status !== "Return Requested" &&
    item.returnRequest?.status !== "Pending"
  ) {
    const err = new Error("No pending return request found for this item.");
    err.statusCode = 400;
    throw err;
  }

  const isApproved = decision && /^(approved|approve)$/i.test(decision.trim());

  if (isApproved) {
    item.status = "Returned";
    item.returnRequest = {
      ...(item.returnRequest?.toObject ? item.returnRequest.toObject() : item.returnRequest),
      status: "Approved",
      reviewedAt: new Date(),
      adminNote: adminNotes || "Return approved by Admin",
    };

    // Increment inventory stock ONLY for this specific item variant
    if (item.variant) {
      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity },
      });
    }

    // Refund ONLY the returned item total amount to the user's wallet (if order is paid)
    const isPaid =
      order.paymentStatus === "Paid" ||
      order.paymentStatus === "Partially Refunded";

    if (isPaid && item.itemTotal > 0) {
      await creditWalletRefund({
        userId: order.user,
        amount: item.itemTotal,
        orderId: order.orderId,
        reason: `Refund for returned item (${item.title} - ${item.size}) in Order #${order.orderId}`,
      });
    }

    // Check remaining active items (not returned or cancelled)
    const activeItems = order.items.filter(
      (it) => it.status !== "Returned" && it.status !== "Cancelled",
    );

    if (activeItems.length === 0) {
      // If all items are now returned or cancelled
      order.orderStatus = "Returned";
      if (isPaid) {
        order.paymentStatus = "Refunded";
      }
    } else if (isPaid) {
      order.paymentStatus = "Partially Refunded";
    }
  } else {
    // Rejected: revert item status back to Delivered
    item.status = "Delivered";
    item.returnRequest = {
      ...(item.returnRequest?.toObject ? item.returnRequest.toObject() : item.returnRequest),
      status: "Rejected",
      reviewedAt: new Date(),
      adminNote: adminNotes || "Return rejected by Admin",
    };
  }

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    comment: `Item "${item.title}" (${item.color}/${item.size}) return ${
      isApproved ? "approved" : "rejected"
    } by Admin. Note: ${adminNotes || "N/A"}`,
    updatedBy: "Admin",
  });

  await order.save();
  return order;
};

export default reviewCustomerItemReturnRequest;
