import {
  getOrCreateWallet,
  initiateAddMoney,
  verifyAndCreditWallet,
} from "../../services/shop/walletService.js";
import { processWalletOrder } from "../../services/shop/processWalletOrder.js";

export const getWallet = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);

    return res.status(200).json({
      success: true,
      wallet,
    });
  } catch (err) {
    next(err);
  }
};

export const createWalletTopupOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await initiateAddMoney({
      userId: req.user._id,
      amount,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyWalletTopup = async (req, res, next) => {
  try {
    const { amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

    const wallet = await verifyAndCreditWallet({
      userId: req.user._id,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return res.status(200).json({
      success: true,
      message: `₹${amount} added to your wallet successfully!`,
      wallet,
    });
  } catch (err) {
    next(err);
  }
};

export const createWalletOrder = async (req, res, next) => {
  try {
    const order = await processWalletOrder({
      userId: req.user._id,
      addressId: req.body.addressId,
      couponCode: req.body.couponCode,
    });
    return res.status(201).json({
      success: true,
      message: "Order placed successfully using wallet!",
      order,
    });
  } catch (err) {
    next(err);
  }
};
