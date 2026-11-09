import crypto from "crypto";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";
import sendEmail from "../../utils/sendEmail.js";

export const sendChangeEmailOtp = async ({ userId, newEmail }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User account not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    const err = new Error("New email cannot be the same as your current email");
    err.statusCode = 400;
    throw err;
  }

  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser) {
    const err = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const hashOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

  await Otp.deleteMany({ email: newEmail.toLowerCase() });
  await Otp.create({ email: newEmail.toLowerCase(), otp: hashOtp });

  await sendEmail({
    to: newEmail,
    subject: "ATELIER - Verify Your New Email Address",
    text: `Your email change verification code is: ${rawOtp}. This code expires in 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E7E5E4; border-radius: 8px;">
        <h2 style="letter-spacing: 2px; color: #1C1917; margin-bottom: 8px;">ATELIER</h2>
        <p style="color: #78716C; font-size: 14px;">We received a request to update your account email to <strong>${newEmail}</strong>.</p>
        <p style="color: #78716C; font-size: 14px;">Use the verification code below to confirm this change:</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #FBFBFA; border: 1px dashed #D6D3D1; text-align: center; border-radius: 6px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1C1917;">${rawOtp}</span>
        </div>
        <p style="font-size: 13px; color: #A8A29E; margin: 0;">This code expires in 5 minutes. If you did not request this change, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { email: newEmail };
};

export default sendChangeEmailOtp;
