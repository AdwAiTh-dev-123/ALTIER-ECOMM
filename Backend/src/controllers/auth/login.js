import { loginUser } from "../../services/auth/index.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginUser({ email, password });

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default login;
