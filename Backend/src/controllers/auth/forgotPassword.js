import { sendPasswordResetLink } from "../../services/auth/index.js";

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await sendPasswordResetLink(email);

    return res.status(200).json({
      success: true,
      message: "Password reset link has been dispatched to your email address.",
    });
  } catch (err) {
    next(err);
  }
};

export default forgotPassword;
