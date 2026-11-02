import bcrypt from "bcrypt";
import User from "../../models/User.js";

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.password && !user.googleId) {
    if (!currentPassword) {
      const err = new Error("Please enter your current password");
      err.statusCode = 400;
      throw err;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const err = new Error("Current password is incorrect");
      err.statusCode = 400;
      throw err;
    }
  } else if (user.password && user.googleId && currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const err = new Error("Current password is incorrect");
      err.statusCode = 400;
      throw err;
    }
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return true;
};

export default changeUserPassword;
