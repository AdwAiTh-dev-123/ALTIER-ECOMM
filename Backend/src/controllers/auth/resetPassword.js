import { resetPasswordWithToken } from "../../services/auth/index.js";

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await resetPasswordWithToken({ token, password });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful! Please sign in with your new password",
    });
  } catch (err) {
    next(err);
  }
};

export default resetPassword;
