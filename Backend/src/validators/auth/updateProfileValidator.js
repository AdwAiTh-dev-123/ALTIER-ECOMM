export const validateUpdateProfile = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({
      success: false,
      message: "Username / full name is required.",
    });
  }

  const trimmedName = name.trim();

  if (
    trimmedName.length < 2 ||
    trimmedName.length > 50 ||
    !/^[a-zA-Z\s'-]+$/.test(trimmedName)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter a valid name (2-50 characters, letters, spaces, hyphens, and apostrophes only).",
    });
  }

  req.body.name = trimmedName;
  next();
};

export default validateUpdateProfile;
