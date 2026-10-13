const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/tokenHelper");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const sendMail = require("../utils/sendEmail");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name,email and password is required",
      });
    }

    const existingUser = await User.findOne({ email });
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const findUser = await User.findOne({ email }).select("+password");

    if (!findUser) {
      return res.status(401).json({
        success: false,
        message: "User does not exist.Pls create your account",
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (findUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account access has been restricted by an administrator",
      });
    }

    const token = generateToken(findUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        role: findUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

const logOut = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google authentation token is required",
      });
    }

    const tokenVerify = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = tokenVerify.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended by an administrator",
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar) {
          user.avatar = picture;
          await user.save();
        }
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        googleId,
        avatar: picture,
        role: "customer",
      });
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Successfully authenticatied with Google",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.avatar,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const findUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    if (!findUser.password && findUser.googleId) {
      return res.status(400).json({
        success: false,
        message:
          "This account was registered using Google. Please sign in with Google",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    findUser.resetPasswordToken = hashedToken;
    findUser.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await findUser.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

    await sendMail({
      to: findUser.email,
      subject: "Atelier - Password Reset Request",
      text: `You requested a password reset. Click this link to set a new password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes. If you did not request this, please ignore this email.`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
          <h2 style="letter-spacing: 2px;">ATELIER</h2>
          <p>You requested a password reset for your ATELIER account.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #1c1917; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password &rarr;
            </a>
          </p>
          <p style="font-size: 13px; color: #666;">This link expires in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
        </div>`,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your mail",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Unable to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful! Please sign in with your new password",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to reset password",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logOut,
  googleAuth,
  forgotPassword,
  resetPassword,
};
