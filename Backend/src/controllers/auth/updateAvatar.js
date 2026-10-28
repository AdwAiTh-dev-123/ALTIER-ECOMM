import { uploadBufferToCloudinary } from "../../config/cloudinary.js";
import User from "../../models/User.js";

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const secureUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "altier/avatars",
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: secureUrl } },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      avatar: secureUrl,
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile photo",
      error: err.message,
    });
  }
};

export default updateAvatar;
