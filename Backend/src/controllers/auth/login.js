import bcrypt from "bcrypt";
import User from "../../models/User.js";
import generateToken from "../../utils/tokenHelper.js";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const findUser = await User.findOne({ email }).select("+password");

    if (!findUser) {
      return res.status(401).json({
        success: false,
        message: "User does not exist.Pls create your account",
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (findUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account access has been restricted by an administrator",
      });
    }

    const token = generateToken(findUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        role: findUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export default login;
