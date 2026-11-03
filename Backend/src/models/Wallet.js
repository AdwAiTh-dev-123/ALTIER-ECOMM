import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      default: () =>
        `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Transaction amount must be atleast 1"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },
    transactions: [TransactionSchema],
  },
  { timeStamps: true },
);

export default mongoose.model("Wallet", WalletSchema);
