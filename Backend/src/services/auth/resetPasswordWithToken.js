import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../../models/User.js";

export const resetPasswordWithToken = async ({ token, password }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error(
      "Password reset link is invalid or has expired. Please request a new one.",
    );
    err.statusCode = 400;
    throw err;
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return true;
};

export default resetPasswordWithToken;
