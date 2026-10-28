import crypto from "crypto";
import User from "../../models/User.js";
import sendMail from "../../utils/sendEmail.js";

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

export default forgotPassword;
