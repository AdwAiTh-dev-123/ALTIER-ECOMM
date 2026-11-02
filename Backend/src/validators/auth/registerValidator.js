export const validateRegister = (req, res, next) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res.status(400).json({
      success: false,
      message: "Name,email,password and verification code is required",
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.toLowerCase().trim();

  if (
    trimmedName.length < 2 ||
    trimmedName.length > 50 ||
    !/^[a-zA-Z\s'-]+$/.test(trimmedName)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid full name (2-50 alphabetic characters).",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
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
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  req.body.name = trimmedName;
  req.body.email = trimmedEmail;
  req.body.otp = otp.trim();

  next();
};
