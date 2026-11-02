import { updateUserAvatarService } from "../../services/auth/index.js";

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const { secureUrl, user } = await updateUserAvatarService({
      userId: req.user._id,
      fileBuffer: req.file.buffer,
    });

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      avatar: secureUrl,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default updateAvatar;
