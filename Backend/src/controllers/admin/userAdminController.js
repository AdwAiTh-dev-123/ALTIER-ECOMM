const User = require("../../models/User");
const {
  formatPaginatedResponse,
  getPagination,
} = require("../../utils/paginationHelper");

const getAllUsers = async (req, res) => {
    const {
      search = "",
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const { page, limit, skip } = getPagination(req.query, 10);

    const allowedSortFields = ["name", "email", "createdAt", "isBlocked"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const sortConfig = { [field]: order };

    const basefilter = { role: { $ne: "admin" } };

    const query = { ...basefilter };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status === "active") {
      query.isBlocked = false;
    } else if (status === "blocked") {
      query.isBlocked = true;
    }
    const [users, totalFilteredUsers, totalUsers, blockedUsers, activeUsers] =
      await Promise.all([
        User.find(query)
          .select("-password -resetPasswordToken -resetPasswordExpires")
          .sort(sortConfig)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
        User.countDocuments(basefilter),
        User.countDocuments({ ...basefilter, isBlocked: true }),
        User.countDocuments({ ...basefilter, isBlocked: false }),
      ]);

    return res.status(200).json(
      formatPaginatedResponse({
        page,
        limit,
        totalItems: totalFilteredUsers,
        data: users,
        extraFields: {
          stats: {
            total: totalUsers,
            blocked: blockedUsers,
            active: activeUsers,
          },
        },
      }),
    );
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

const toggleisBlocked = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

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
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

module.exports = { toggleisBlocked, getAllUsers };
