import bcrypt from "bcrypt";
import User from "../../models/User.js";
import generateToken from "../../utils/tokenHelper.js";

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (user.isBlocked) {
    const err = new Error(
      "Account access has been restricted by an administrator",
    );
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export default loginUser;
