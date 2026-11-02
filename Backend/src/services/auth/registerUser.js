import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";
import generateToken from "../../utils/tokenHelper.js";

export const registerUser = async ({ name, email, password, otp }) => {
  const hashSubmitOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const recordOtp = await Otp.findOne({ email, otp: hashSubmitOtp });

  if (!recordOtp) {
    const err = new Error("Invalid or expired verification token");
    err.statusCode = 400;
    throw err;
  }

  const isExpired =
    Date.now() - new Date(recordOtp.createdAt).getTime() > 5 * 60 * 1000;
  if (isExpired) {
    await Otp.deleteMany({ email });
    const err = new Error(
      "Verification code has expired. Please request a new one",
    );
    err.statusCode = 400;
    throw err;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error(
      "An account with this email already exists. Please sign in instead",
    );
    err.statusCode = 409;
    throw err;
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name,
    email,
    password: hashPassword,
  });

  await Otp.deleteMany({ email });
  const token = generateToken(newUser);

  return {
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    token,
  };
};

export default registerUser;
