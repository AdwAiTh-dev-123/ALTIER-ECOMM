import { fetchAllUsers, toggleUserBlockStatus } from "../../services/admin/index.js";

const getAllUsers = async (req, res, next) => {
  try {
    const result = await fetchAllUsers(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await toggleUserBlockStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `User account has been successfully ${user.isBlocked ? "blocked" : "unblocked"}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    next(err);
  }
};

export { getAllUsers, toggleUserBlock };
