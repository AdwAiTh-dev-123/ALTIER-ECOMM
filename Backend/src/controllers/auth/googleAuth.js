import { authenticateWithGoogle } from "../../services/auth/index.js";

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google authentication token is required",
      });
    }

    const { user, token } = await authenticateWithGoogle(idToken);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Successfully authenticated with Google",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default googleAuth;
