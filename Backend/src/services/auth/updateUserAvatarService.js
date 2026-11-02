import { uploadBufferToCloudinary } from "../../config/cloudinary.js";
import User from "../../models/User.js";

export const updateUserAvatarService = async ({ userId, fileBuffer }) => {
    const secureUrl = await uploadBufferToCloudinary(fileBuffer, "altier/avatars");
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: secureUrl } },
        { new: true }
    );
    return { secureUrl, user: updatedUser };
};

export default updateUserAvatarService;
