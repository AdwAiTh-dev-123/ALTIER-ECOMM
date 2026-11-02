import mongoose from "mongoose";

export const validateOrderStatusUpdate = (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
  }

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid order status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  next();
};

export const validateReturnReview = (req, res, next) => {
  const { id } = req.params;
  const { decision } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
  }

  if (!decision || !["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: 'Decision must be either "Approved" or "Rejected".',
    });
  }

  next();
};
