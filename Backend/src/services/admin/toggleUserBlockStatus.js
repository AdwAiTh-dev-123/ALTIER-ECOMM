import User from "../../models/User.js";

export const toggleUserBlockStatus = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    return user;
};

export default toggleUserBlockStatus;
