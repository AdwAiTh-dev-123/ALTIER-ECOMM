import Category from "../../models/Category.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchAllCategories = async (query) => {
  const { skip, limit } = getPagination(query, 10);
  const filter = { isDeleted: { $ne: true } };

  if (query.search?.trim()) {
    filter.name = { $regex: query.search.trim(), $options: "i" };
  }

  if (query.status === "listed") filter.isListed = true;
  if (query.status === "unlisted") filter.isListed = false;

  const [total, categories, totalAll, activeAll, unlistedAll] = await Promise.all([
    Category.countDocuments(filter),
    Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Category.countDocuments({ isDeleted: { $ne: true } }),
    Category.countDocuments({ isDeleted: { $ne: true }, isListed: true }),
    Category.countDocuments({ isDeleted: { $ne: true }, isListed: false }),
  ])

  return formatPaginatedResponse(
    categories,
    total,
    query.page,
    limit,
    {
      stats: {
        total: totalAll,
        active: activeAll,
        unlisted: unlistedAll,
      }
    });
};

export default fetchAllCategories;
