import { updateUserProfile } from "../../services/auth/updateUserProfile.js";

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await updateUserProfile({
      userId: req.user._id,
      name,
    });

    return res.status(200).json({
      success: true,
      message: "Username updated successfully!",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default updateProfile;
