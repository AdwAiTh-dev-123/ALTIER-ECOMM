export const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Reset token and password are required",
    });
  }

  const isSecure =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!isSecure) {
    return res.status(400).json({
      success: false,
      message:
        "New password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character",
    });
  }

  req.body.token = token.trim();
  next();
};
