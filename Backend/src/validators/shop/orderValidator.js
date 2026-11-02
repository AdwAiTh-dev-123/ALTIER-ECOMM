import mongoose from "mongoose";

export const validateCodOrder = (req, res, next) => {
  const { addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({
      success: false,
      message: "Shipping address ID is required to place an order.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid shipping address ID.",
    });
  }

  next();
};

export const validateRazorpayVerify = (req, res, next) => {
  const razorpayOrderId =
    req.body.razorpayOrderId || req.body.razorpay_order_id;
  const razorpayPaymentId =
    req.body.razorpayPaymentId || req.body.razorpay_payment_id;
  const razorpaySignature =
    req.body.razorpaySignature || req.body.razorpay_signature;
  const orderId = req.body.orderId;

  if (
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature ||
    !orderId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Missing Razorpay verification parameters (order ID, payment ID, or signature).",
    });
  }
  next();
};

export const validateReturnRequest = (req, res, next) => {
  const { reason, comment } = req.body;
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "A return reason is required.",
    });
  }
  if (comment && comment.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Comment must not exceed 500 characters.",
    });
  }
  next();
};
