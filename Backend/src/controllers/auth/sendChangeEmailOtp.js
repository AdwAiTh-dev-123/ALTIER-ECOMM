import { sendChangeEmailOtp } from "../../services/auth/index.js";

const sendChangeEmailOtpController = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    await sendChangeEmailOtp({
      userId: req.user._id,
      newEmail,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your new email address",
    });
  } catch (err) {
    next(err);
  }
};

export default sendChangeEmailOtpController;
