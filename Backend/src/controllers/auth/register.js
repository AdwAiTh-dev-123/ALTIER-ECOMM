import { registerUser } from "../../services/auth/index.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password, otp } = req.body;

    const { user, token } = await registerUser({
      name,
      email,
      password,
      otp,
    });

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default register;
