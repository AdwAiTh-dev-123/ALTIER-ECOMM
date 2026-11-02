import Order from "../../models/Order.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchUserOrdersList = async ({ userId, query }) => {
  const { page, limit, skip } = getPagination(query, 10);
  const filter = { user: userId };
  const { status, search } = query;

  // 1. Status Filter (case-insensitive for ALL / all)
  if (status && status.toUpperCase() !== "ALL") {
    if (status.toUpperCase() === "ACTIVE") {
      filter.orderStatus = {
        $in: ["Pending", "Confirmed", "Shipped", "Out for Delivery"],
      };
      filter.paymentStatus = { $ne: "Failed" };
    } else if (status.toUpperCase() === "FAILED") {
      filter.paymentStatus = "Failed";
    } else {
      filter.orderStatus = status;
    }
  }

  // 2. Search by orderId or item title
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [{ orderId: searchRegex }, { "items.title": searchRegex }];
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
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

export default fetchUserOrdersList;
