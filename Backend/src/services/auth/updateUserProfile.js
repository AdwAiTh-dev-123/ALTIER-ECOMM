import User from "../../models/User.js";

export const updateUserProfile = async ({ userId, name }) => {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error("User account not found");
    err.statusCode = 404;
    throw err;
  }

  user.name = name.trim();
  await user.save();

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isBlocked: user.isBlocked,
    googleId: user.googleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export default updateUserProfile;
