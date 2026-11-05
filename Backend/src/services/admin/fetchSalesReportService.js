import Order from "../../models/Order.js";
import { getPagination } from "../../utils/paginationHelper.js";

const buildDateFilter = (dateRange, startDate, endDate) => {
  const now = new Date();
  let start;
  let end = new Date(now.setHours(23, 59, 59, 999));

  switch (dateRange) {
    case "today": {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      break;
    }

    case "week": {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    }

    case "month": {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    }

    case "year": {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "custom": {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }

    default:
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }

  const filter = {};

  if (start && end) {
    filter.createdAt = { $gte: start, $lte: end };
  } else if (start) {
    filter.createdAt = { $gte: start };
  } else if (end) {
    filter.createdAt = { $lte: end };
  }

  return { filter, start, end };
};

export const fetchSalesReportService = async (query = {}, isExport = false) => {
  const {
    dateRange = "month",
    startDate,
    endDate,
    status = "all",
    paymentMethod = "all",
  } = query;

  const {
    filter: dateQuery,
    start,
    end,
  } = buildDateFilter(dateRange, startDate, endDate);
  const matchFilter = { ...dateQuery };

  if (status && status !== "all") {
    matchFilter.orderStatus = status;
  } else {
    matchFilter.orderStatus = { $nin: ["Cancelled", "Returned"] };
  }

  if (paymentMethod && paymentMethod !== "all") {
    matchFilter.paymentMethod = paymentMethod.toUpperCase();
  }

  const statsAggregate = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSalesAmount: { $sum: "$pricing.totalAmount" },
        totalSubtotal: { $sum: "$pricing.subtotal" },
        totalShipping: { $sum: "$pricing.shippingFee" },
        totalItemsSold: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);

  const summary = statsAggregate[0] || {
    totalOrders: 0,
    totalSalesAmount: 0,
    totalSubtotal: 0,
    totalShipping: 0,
    totalItemsSold: 0,
  };

  summary.averageOrderValue =
    summary.totalOrders > 0
      ? Math.round(summary.totalSalesAmount / summary.totalOrders)
      : 0;

  if (isExport) {
    const allOrders = await Order.find(matchFilter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return {
      orders: allOrders,
      summary,
      dateRange: { start, end, preset: dateRange },
    };
  }

  const { page, limit, skip } = getPagination(query, 10);
  const total = await Order.countDocuments(matchFilter);
  const orders = await Order.find(matchFilter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return {
    orders,
    summary,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalOrders: total,
      limit,
    },
    dateRange: { start, end, preset: dateRange },
  };
};
export default fetchSalesReportService;
