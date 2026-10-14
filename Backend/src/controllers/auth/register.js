const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../../models/User");
const generateToken = require("../../utils/tokenHelper");
const Otp = require("../../models/Otp");

const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !name || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name,email, password and verification code are required",
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

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
      name,
      email,
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

module.exports = register;
