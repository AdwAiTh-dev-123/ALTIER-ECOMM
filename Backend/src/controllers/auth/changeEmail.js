import { changeUserEmail } from "../../services/auth/index.js";

const changeEmailController = async (req, res, next) => {
  try {
    const { newEmail, otp } = req.body;
    const updatedUser = await changeUserEmail({
      userId: req.user._id,
      newEmail,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export default changeEmailController;
