import crypto from "crypto";
import Wallet from "../../models/Wallet.js";
import { razorpayInstance } from "../../config/razorpay.js";

export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
      balance: 0,
      transactions: [],
    });
  }

  wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return wallet;
};

const MAX_WALLET_TOPUP = 50000;

export const initiateAddMoney = async ({ userId, amount }) => {
  const parsedAmount = Number(amount);

  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 1) {
    const err = new Error("Amount must be at least 1");
    err.statusCode = 400;
    throw err;
  }

  if (parsedAmount > MAX_WALLET_TOPUP) {
    const err = new Error(
      `Wallet amount cannot exceed ₹${MAX_WALLET_TOPUP.toLocaleString("en-IN")} per transaction.`,
    );
    err.statusCode = 400;
    throw err;
  }

  try {
    const receipt = `WLT-TOPUP-${Date.now().toString().slice(-6)}`;
    const rzpOrder = await razorpayInstance.orders.create({
      amount: Math.round(parsedAmount * 100),
      currency: "INR",
      receipt,
    });

    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    };
  } catch (rzpErr) {
    const err = new Error(
      rzpErr.error?.description || "Payment gateway rejected the top-up order.",
    );
    err.statusCode = 400;
    throw err;
  }
};

export const verifyAndCreditWallet = async ({
  userId,
  amount,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const expectedSignature = hmac.digest("hex");

  if (expectedSignature !== razorpaySignature) {
    const err = new Error("Invalid payment signature.Verification failed");
    err.statusCode = 400;
    throw err;
  }

  const parsedAmount = Number(amount);

  await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc: { balance: parsedAmount },
      $push: {
        transactions: {
          type: "CREDIT",
          amount: parsedAmount,
          description: "Added funds to wallet via Razorpay",
          paymentId: razorpayPaymentId,
          date: new Date(),
        },
      },
    },
    { new: true },
  );

  return updatedWallet;
};

export const creditWalletRefund = async ({
  userId,
  amount,
  orderId,
  reason,
}) => {
  await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc: { balance: amount },
      $push: {
        transactions: {
          type: "CREDIT",
          amount,
          description: reason || `Refund for Order #${orderId}`,
          orderId,
          date: new Date(),
        },
      },
    },
    { new: true },
  );

  return updatedWallet;
};
