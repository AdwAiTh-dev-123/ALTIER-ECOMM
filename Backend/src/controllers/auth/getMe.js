import User from "../../models/User.js";

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userData = user.toObject();
    userData.hasPassword = Boolean(user.password);
    delete userData.password;

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (err) {
    next(err);
  }
};

export default getMe;
