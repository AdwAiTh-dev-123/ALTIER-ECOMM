import { sendRegistrationOtp } from "../../services/auth/index.js";

const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await sendRegistrationOtp(email);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to email",
    });
  } catch (err) {
    next(err);
  }
};

export default sendOtp;
