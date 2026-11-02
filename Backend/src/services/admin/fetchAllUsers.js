import User from "../../models/User.js";
import { getPagination, formatPaginatedResponse } from "../../utils/paginationHelper.js";

export const fetchAllUsers = async (query) => {
    const { skip, limit } = getPagination(query, 10);
    const filter = { role: { $ne: "admin" } };

    if (query.search?.trim()) {
        filter.$or = [
            { name: { $regex: query.search.trim(), $options: "i" } },
            { email: { $regex: query.search.trim(), $options: "i" } },
        ];
    }

    if (query.status === "active") filter.isBlocked = false;
    if (query.status === "blocked") filter.isBlocked = true;

    const [users, totalFilteredUsers, totalUsers, blockedUsers, activeUsers] =
        await Promise.all([
            User.find(filter)
                .select("-password -resetPasswordToken -resetPasswordExpires")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
            User.countDocuments({ role: { $ne: "admin" } }),
            User.countDocuments({ role: { $ne: "admin" }, isBlocked: true }),
            User.countDocuments({ role: { $ne: "admin" }, isBlocked: false }),
        ]);

    return formatPaginatedResponse({
        page: query.page,
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
    });
};

export default fetchAllUsers;
