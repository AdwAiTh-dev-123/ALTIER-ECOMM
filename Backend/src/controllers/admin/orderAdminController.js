import Order from "../../models/Order.js";
import Variant from "../../models/Variants.js";

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

export const getAllAdminOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { orderId: searchRegex },
        { "shippingAddress.fullName": searchRegex },
        { "shippingAddress.phone": searchRegex },
        { "items.title": searchRegex },
      ];
    }

    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        totalOrders,
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: err.message,
    });
  }
};

export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    }).populate("user", "name email phone");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
      allowedNextStatuses: ALLOWED_TRANSITIONS[order.orderStatus] || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, comment } = req.body;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    const currentStatus = order.orderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Illegal transition from "${currentStatus}" to "${newStatus}". Permitted next statuses: ${allowed.join(", ") || "None (Terminal)"}`,
      });
    }

    if (newStatus === "Cancelled" && currentStatus !== "Cancelled") {
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
      }
    }

    if (newStatus === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }

    order.orderStatus = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      comment:
        comment ||
        `Status updated from ${currentStatus} to ${newStatus} by Admin`,
      updatedBy: "Admin",
    });
    await order.save();
    return res.status(200).json({
      success: true,
      message: `Order status successfully updated to "${newStatus}".`,
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: err.message,
    });
  }
};

export const reviewReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body; // action: "APPROVE" | "REJECT"
    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "APPROVE" or "REJECT".',
      });
    }
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (
      order.orderStatus !== "Return Requested" ||
      order.returnRequest?.status !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order does not have an active pending return request.",
      });
    }
    if (action === "APPROVE") {
      // Restore inventory
      for (const item of order.items) {
        await Variant.findByIdAndUpdate(item.variant, {
          $inc: { stock: item.quantity },
        });
      }
      order.orderStatus = "Returned";
      order.returnRequest.status = "Approved";
      order.returnRequest.reviewedAt = new Date();
      order.returnRequest.adminNote = adminNote || "Return approved by Admin";
      if (order.paymentStatus === "Paid") {
        order.paymentStatus = "Refunded";
      }
      order.statusHistory.push({
        status: "Returned",
        timestamp: new Date(),
        comment: `Return approved by Admin. ${adminNote ? "Note: " + adminNote : ""}`,
        updatedBy: "Admin",
      });
    } else {
      // Revert back to Delivered
      order.orderStatus = "Delivered";
      order.returnRequest.status = "Rejected";
      order.returnRequest.reviewedAt = new Date();
      order.returnRequest.adminNote = adminNote || "Return rejected by Admin";
      order.statusHistory.push({
        status: "Delivered",
        timestamp: new Date(),
        comment: `Return rejected by Admin. Reason: ${adminNote || "Does not satisfy return policy"}`,
        updatedBy: "Admin",
      });
    }
    await order.save();
    return res.status(200).json({
      success: true,
      message: `Return request ${action === "APPROVE" ? "approved" : "rejected"}.`,
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to process return request",
      error: err.message,
    });
  }
};
