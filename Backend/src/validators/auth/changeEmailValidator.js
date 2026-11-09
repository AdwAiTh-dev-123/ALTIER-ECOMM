export const validateChangeEmail = (req, res, next) => {
  const { newEmail, otp } = req.body;

  if (!newEmail || !otp) {
    return res.status(400).json({
      success: false,
      message: "Both new email address and verification code are required",
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

  const trimmedOtp = otp.toString().trim();
  if (!/^\d{6}$/.test(trimmedOtp)) {
    return res.status(400).json({
      success: false,
      message: "Verification code must be exactly 6 digits",
    });
  }

  req.body.newEmail = trimmedEmail;
  req.body.otp = trimmedOtp;
  next();
};
