const User = require("../../models/User");

const getAllUsers = async (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;

    const basefilter = { role: { $ne: "admin" } };

    const query = {...basefilter};

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

    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });


    const [totalUsers, blockedUsers, activeUsers] = await Promise.all([
      User.countDocuments(basefilter),
      User.countDocuments({...basefilter,isBlocked:true}),
      User.countDocuments({...basefilter,isBlocked:true})
    ])



    return res.status(200).json({
      success: true,
      count: users.length,
      stats: {
        total: totalUsers,
        blocked: blockedUsers,
        active: activeUsers,
      },
      data: users,
    });
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
