import Order from "../../models/Order.js";
import { getPagination } from "../../utils/paginationHelper.js";

const buildDateFilter = (dateRange, startDate, endDate) => {
  const now = new Date();
  let start;
  let end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (dateRange) {
    case "today": {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      break;
    }

    case "week": {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7,
        0,
        0,
        0,
        0,
      );
      break;
    }

    case "month": {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30,
        0,
        0,
        0,
        0,
      );
      break;
    }

    case "year": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
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
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30,
        0,
        0,
        0,
        0,
      );
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

export const enrichOrderWithRefunds = (order) => {
  let refundAmount = 0;
  if (order.paymentStatus === "Refunded") {
    refundAmount = order.pricing?.totalAmount || 0;
  } else if (order.paymentStatus === "Partially Refunded") {
    refundAmount = (order.items || []).reduce((sum, item) => {
      if (item.status === "Cancelled" || item.status === "Returned") {
        return sum + (item.itemTotal || 0);
      }
      return sum;
    }, 0);
  }

  const activeItemsCount = (order.items || []).reduce((sum, item) => {
    if (item.status !== "Cancelled" && item.status !== "Returned") {
      return sum + (item.quantity || 1);
    }
    return sum;
  }, 0);

  const returnedItemsCount = (order.items || []).reduce((sum, item) => {
    if (item.status === "Returned") {
      return sum + (item.quantity || 1);
    }
    return sum;
  }, 0);

  const netAmount = Math.max(
    0,
    (order.pricing?.totalAmount || 0) - refundAmount,
  );

  return {
    ...order,
    refundAmount,
    netAmount,
    activeItemsCount,
    returnedItemsCount,
  };
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
    // When viewing all valid orders, exclude fully cancelled orders, but include returned ones
    matchFilter.orderStatus = { $ne: "Cancelled" };
  }

  if (paymentMethod && paymentMethod !== "all") {
    matchFilter.paymentMethod = paymentMethod.toUpperCase();
  }

  const statsAggregate = await Order.aggregate([
    { $match: matchFilter },
    {
      $project: {
        pricing: 1,
        paymentStatus: 1,
        orderStatus: 1,
        activeItems: {
          $filter: {
            input: "$items",
            as: "item",
            cond: {
              $not: { $in: ["$$item.status", ["Cancelled", "Returned"]] },
            },
          },
        },
        returnedItems: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $eq: ["$$item.status", "Returned"] },
          },
        },
        refundedItems: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $in: ["$$item.status", ["Cancelled", "Returned"]] },
          },
        },
      },
    },
    {
      $project: {
        totalAmount: "$pricing.totalAmount",
        subtotal: "$pricing.subtotal",
        shippingFee: "$pricing.shippingFee",
        couponDiscount: { $ifNull: ["$pricing.couponDiscount", 0] },
        activeQuantity: { $sum: "$activeItems.quantity" },
        returnedQuantity: { $sum: "$returnedItems.quantity" },
        isReturned: {
          $cond: [
            {
              $or: [
                { $eq: ["$orderStatus", "Returned"] },
                { $gt: [{ $size: "$returnedItems" }, 0] },
              ],
            },
            1,
            0,
          ],
        },
        orderRefund: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$paymentStatus", "Refunded"] },
                then: "$pricing.totalAmount",
              },
              {
                case: { $eq: ["$paymentStatus", "Partially Refunded"] },
                then: { $sum: "$refundedItems.itemTotal" },
              },
            ],
            default: 0,
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        grossSalesAmount: { $sum: "$totalAmount" },
        totalSubtotal: { $sum: "$subtotal" },
        totalShipping: { $sum: "$shippingFee" },
        totalCouponDiscount: { $sum: "$couponDiscount" },
        totalRefundAmount: { $sum: "$orderRefund" },
        totalItemsSold: { $sum: "$activeQuantity" },
        totalReturnedItems: { $sum: "$returnedQuantity" },
        returnedOrdersCount: { $sum: "$isReturned" },
      },
    },
  ]);

  const summaryRaw = statsAggregate[0] || {
    totalOrders: 0,
    grossSalesAmount: 0,
    totalSubtotal: 0,
    totalShipping: 0,
    totalCouponDiscount: 0,
    totalRefundAmount: 0,
    totalItemsSold: 0,
    totalReturnedItems: 0,
    returnedOrdersCount: 0,
  };

  const grossSales = summaryRaw.grossSalesAmount || 0;
  const totalRefundAmount = summaryRaw.totalRefundAmount || 0;
  const netSalesAmount = Math.max(0, grossSales - totalRefundAmount);

  const summary = {
    ...summaryRaw,
    grossSalesAmount: grossSales,
    totalSalesAmount: grossSales,
    netSalesAmount,
    totalRefundAmount,
    averageOrderValue:
      summaryRaw.totalOrders > 0
        ? Math.round(netSalesAmount / summaryRaw.totalOrders)
        : 0,
  };

  if (isExport) {
    const rawOrders = await Order.find(matchFilter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const allOrders = rawOrders.map(enrichOrderWithRefunds);

    return {
      orders: allOrders,
      summary,
      dateRange: { start, end, preset: dateRange },
    };
  }

  const { page, limit, skip } = getPagination(query, 10);
  const total = await Order.countDocuments(matchFilter);
  const rawOrders = await Order.find(matchFilter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const orders = rawOrders.map(enrichOrderWithRefunds);

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
