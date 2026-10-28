import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60,
    },
  },
  { timestamps: false },
);

export default mongoose.model("Otp", OtpSchema);
