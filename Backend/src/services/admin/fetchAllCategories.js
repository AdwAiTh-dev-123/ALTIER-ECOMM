import Category from "../../models/Category.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchAllCategories = async (query) => {
  const { skip, limit } = getPagination(query, 10);
  const filter = { isDeleted: { $ne: true } };

  // Search by category name
  if (query.search?.trim()) {
    filter.name = { $regex: query.search.trim(), $options: "i" };
  }

  // Status filter: accepts both "listed" and "active" from frontend tabs
  if (query.status === "listed" || query.status === "active")
    filter.isListed = true;
  if (query.status === "unlisted") filter.isListed = false;

  // Dynamic sorting with safe allowlist
  const { sortBy = "createdAt", sortOrder = "desc" } = query;
  const allowedSortFields = ["createdAt", "name"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOptions = { [sortField]: sortDirection };

  const [total, categories, totalAll, activeAll, unlistedAll] =
    await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .collation({ locale: "en", strength: 2 })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Category.countDocuments({ isDeleted: { $ne: true }, isListed: true }),
      Category.countDocuments({ isDeleted: { $ne: true }, isListed: false }),
    ]);

  return formatPaginatedResponse(categories, total, query.page, limit, {
    stats: {
      total: totalAll,
      active: activeAll,
      unlisted: unlistedAll,
    },
  });
};

export default fetchAllCategories;
