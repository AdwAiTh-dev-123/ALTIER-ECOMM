import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Token is missing or invalid",
      });
    }

    const jwtVerify = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(jwtVerify.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Token is missing or invalid",
      });
    }

    if (user.isBlocked) {
      res.clearCookie("token", { httpOnly: true });
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: "Account access has been restricted by administrator",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token",
    });
  }
};
