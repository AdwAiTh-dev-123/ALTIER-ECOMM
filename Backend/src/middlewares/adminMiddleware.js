export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin privilages required",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
