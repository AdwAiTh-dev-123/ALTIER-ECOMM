import { changeUserPassword } from "../../services/auth/index.js";

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await changeUserPassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export default changePassword;
