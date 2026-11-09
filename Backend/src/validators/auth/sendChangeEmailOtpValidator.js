export const validateSendChangeEmailOtp = (req, res, next) => {
  const { newEmail } = req.body;

  if (!newEmail) {
    return res.status(400).json({
      success: false,
      message: "New email address is required",
    });
  }

  const trimmedEmail = newEmail.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  req.body.newEmail = trimmedEmail;
  next();
};
