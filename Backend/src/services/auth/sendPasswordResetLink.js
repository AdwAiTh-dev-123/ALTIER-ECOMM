import crypto from "crypto";
import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";

export const sendPasswordResetLink = async (email) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("No account found with this email address");
    err.statusCode = 404;
    throw err;
  }

  if (!user.password && user.googleId) {
    const err = new Error(
      "This account uses Google Sign-In. Please sign in with Google.",
    );
    err.statusCode = 400;
    throw err;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
    subject: "ATELIER - Password Reset Request",
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E7E5E4; border-radius: 8px;">
        <h2 style="letter-spacing: 2px; color: #1C1917; margin-bottom: 8px;">ATELIER</h2>
        <p style="color: #78716C; font-size: 14px;">You requested a password reset. Click the button below:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #1C1917; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #A8A29E;">Link expires in 15 minutes.</p>
      </div>
    `,
  });

  return true;
};

export default sendPasswordResetLink;
