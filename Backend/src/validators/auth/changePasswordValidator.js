export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirmation password are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirmation password do not match",
    });
  }

  const isSecure =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!isSecure) {
    return res.status(400).json({
      success: false,
      message:
        "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
    });
  }

  next()
};
