import Order from "../../models/Order.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchAllOrdersForAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query, 10);
  const filter = {};
  const { search, status, sortBy = "createdAt", sortOrder = "desc" } = query;

  // 1. Search across orderId, recipient name, phone, or item title
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { orderId: searchRegex },
      { "shippingAddress.fullName": searchRegex },
      { "shippingAddress.phone": searchRegex },
      { "items.title": searchRegex },
    ];
  }

  // 2. Status Filter (case-insensitive for all / ALL)
  if (status && status.toLowerCase() !== "all") {
    filter.orderStatus = status;
  }

  const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse(orders, total, page, limit, {
    orders,
    pagination: {
      totalOrders: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
};

export default fetchAllOrdersForAdmin;
