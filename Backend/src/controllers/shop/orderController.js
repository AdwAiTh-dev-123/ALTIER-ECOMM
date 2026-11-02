import {
  processCodOrder,
  initiateRazorpayOrder,
  verifyAndCompletePayment,
  recordPaymentFailure,
  fetchOrderDetails,
  fetchUserOrdersList,
  cancelUserOrder,
  requestOrderReturn,
} from "../../services/shop/index.js";

export const createCodOrder = async (req, res, next) => {
  try {
    const order = await processCodOrder({
      userId: req.user._id,
      addressId: req.body.addressId,
    });
    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { addressId, retryOrderId } = req.body;
    const result = await initiateRazorpayOrder({
      userId: req.user._id,
      addressId,
      retryOrderId,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {

    const razorpayOrderId =
      req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpayPaymentId =
      req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpaySignature =
      req.body.razorpaySignature || req.body.razorpay_signature;
    const orderId = req.body.orderId;
    const order = await verifyAndCompletePayment({
      userId: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    });
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const handleRazorpayFailure = async (req, res, next) => {
  try {
    const { orderId, errorDescription } = req.body;
    const order = await recordPaymentFailure({
      userId: req.user._id,
      orderId,
      errorDescription,
    });
    return res.status(200).json({
      success: true,
      message: "Payment failure recorded",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await fetchOrderDetails({
      orderId: req.params.id,
      user: req.user,
    });
    return res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const data = await fetchUserOrdersList({
      userId: req.user._id,
      query: req.query,
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await cancelUserOrder({
      orderId: req.params.id,
      userId: req.user._id,
      reason: req.body.reason,
    });
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const requestReturn = async (req, res, next) => {
  try {
    const order = await requestOrderReturn({
      orderId: req.params.id,
      userId: req.user._id,
      reason: req.body.reason,
      comment: req.body.comment,
    });
    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};
