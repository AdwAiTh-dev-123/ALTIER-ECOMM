import crypto from "crypto";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";

export const changeUserEmail = async ({ userId, newEmail, otp }) => {
  const hashSubmitOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const recordOtp = await Otp.findOne({
    email: newEmail,
    otp: hashSubmitOtp,
  });

  if (!recordOtp) {
    const err = new Error("Invalid or expired verification code");
    err.statusCode = 400;
    throw err;
  }

  const isExpired =
    Date.now() - new Date(recordOtp.createdAt).getTime() > 5 * 60 * 1000;
  if (isExpired) {
    await Otp.deleteMany({ email: newEmail });
    const err = new Error(
      "Verification code has expired. Please request a new one",
    );
    err.statusCode = 400;
    throw err;
  }

  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser && existingUser._id.toString() !== userId.toString()) {
    const err = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User account not found");
    err.statusCode = 404;
    throw err;
  }

  user.email = newEmail;
  await user.save();

  await Otp.deleteMany({ email: newEmail });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export default changeUserEmail;
