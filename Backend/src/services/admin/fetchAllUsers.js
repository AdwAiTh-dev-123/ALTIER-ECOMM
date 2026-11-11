import User from "../../models/User.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchAllUsers = async (query) => {
  const { skip, limit } = getPagination(query, 10);
  const filter = { role: { $ne: "admin" } };

  if (query.search?.trim()) {
    filter.$or = [
      { name: { $regex: query.search.trim(), $options: "i" } },
      { email: { $regex: query.search.trim(), $options: "i" } },
    ];
  }

  if (query.status === "active") filter.isBlocked = { $ne: true };
  if (query.status === "blocked") filter.isBlocked = true;

  const { sortBy = "createdAt", sortOrder = "desc" } = query;
  const allowedSortFields = ["createdAt", "name", "email"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOptions = { [sortField]: sortDirection };
  const [users, totalFilteredUsers, totalUsers, blockedUsers, activeUsers] =
    await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .collation({ locale: "en", strength: 2 })
        .sort(sortOptions)
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
