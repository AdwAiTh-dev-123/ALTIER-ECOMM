import mongoose from "mongoose";

const isValidOrderId = (id) => {
  if (!id || typeof id !== "string") {
    return false;
  }
  const trimmed = id.trim();
  return mongoose.Types.ObjectId.isValid(trimmed) || trimmed.length >= 3;
};

export const validateOrderStatusUpdate = (req, res, next) => {
  const { id } = req.params;
  const status = req.body.status || req.body.newStatus;

  if (!isValidOrderId(id)) {
    return res.status(400).json({
      success: false,
      message: "invalid order ID",
    });
  }

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Return Requested",
    "Returned",
  ];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid order status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  req.body.status = status;
  next();
};

export const validateReturnReview = (req, res, next) => {
  const { id } = req.params;
  const decision = req.body.decision || req.body.action;

  if (!isValidOrderId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const isApproved = decision && /^(approved|approve)$/i.test(decision.trim());
  const isRejected = decision && /^(rejected|reject)$/i.test(decision.trim());

  if (!decision || (!isApproved && !isRejected)) {
    return res.status(400).json({
      success: false,
      message: 'Decision must be either "Approved" or "Rejected".',
    });
  }

  next();
};
