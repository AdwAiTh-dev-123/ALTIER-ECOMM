import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../models/User.js";
import generateToken from "../../utils/tokenHelper.js";
import Otp from "../../models/Otp.js";

const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !name || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name,email, password and verification code are required",
      });
    }

    const trimmedName = name.trim();

    const trimmedEmail = email.toLowerCase().trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters",
      });
    }
    if (/\d/.test(trimmedName) || !/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message:
          "Name can only contain alphabetic letters and cannot contain numbers",
      });
    }

    const hashSubmitOtp = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    const recordOtp = await Otp.findOne({
      email: trimmedEmail,
      otp: hashSubmitOtp,
    });

    if (!recordOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const isExpired =
      Date.now() - new Date(recordOtp.createdAt).getTime() > 60 * 1000;

    if (isExpired) {
      await Otp.deleteMany({ email: trimmedEmail });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Pls request a new one",
      });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.Please sign in instead",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashPassword,
    });

    await Otp.deleteMany({ email: trimmedEmail });

    const token = generateToken(newUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export default register;
