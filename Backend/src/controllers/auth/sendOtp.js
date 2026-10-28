import crypto from "crypto";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";
import sendEmail from "../../utils/sendEmail.js";

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: trimmedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Sign in instead",
      });
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();

    const hashOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

    await Otp.deleteMany({ email: trimmedEmail });
    await Otp.create({
      email: trimmedEmail,
      otp: hashOtp,
    });

    await sendEmail({
      to: trimmedEmail,
      subject: "ATELIER - Verification Code",
      text: `Your verification code is: ${rawOtp}. This code expires in 1 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E7E5E4; border-radius: 8px;">
          <h2 style="letter-spacing: 2px; color: #1C1917; margin-bottom: 8px;">ATELIER</h2>
          <p style="color: #78716C; font-size: 14px;">Use the verification code below to complete your registration:</p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FBFBFA; border: 1px dashed #D6D3D1; text-align: center; border-radius: 6px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1C1917;">${rawOtp}</span>
          </div>
          <p style="font-size: 13px; color: #A8A29E; margin: 0;">This code will expire in <strong>1 minutes</strong>. If you did not initiate this request, you can disregard this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent to email",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to send verification code",
    });
  }
};

export default sendOtp;
