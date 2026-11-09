import Offer from "../../models/Offer.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const createNewOffer = async ({
  name,
  offerType,
  discountPercentage,
  productId = null,
  categoryId = null,
  startDate,
  endDate,
}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    const err = new Error("Offer end date must be after start date.");
    err.statusCode = 400;
    throw err;
  }

  if (offerType === "PRODUCT" && !productId) {
    const err = new Error("Please select a product for this product offer.");
    err.statusCode = 400;
    throw err;
  }

  if (offerType === "CATEGORY" && !categoryId) {
    const err = new Error("Please select a category for this category offer.");
    err.statusCode = 400;
    throw err;
  }

  const offer = await Offer.create({
    name: name.trim(),
    offerType,
    discountPercentage: Number(discountPercentage),
    product: offerType === "PRODUCT" ? productId : null,
    category: offerType === "CATEGORY" ? categoryId : null,
    startDate: start,
    endDate: end,
    isActive: true,
    isDeleted: false,
  });

  return offer;
};

export const updateExistingOffer = async (
  id,
  {
    name,
    offerType,
    discountPercentage,
    productId = null,
    categoryId = null,
    startDate,
    endDate,
  },
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    const err = new Error("Offer end date must be after start date.");
    err.statusCode = 400;
    throw err;
  }

  if (offerType === "PRODUCT" && !productId) {
    const err = new Error("Please select a product for this product offer.");
    err.statusCode = 400;
    throw err;
  }

  if (offerType === "CATEGORY" && !categoryId) {
    const err = new Error("Please select a category for this category offer.");
    err.statusCode = 400;
    throw err;
  }

  const offer = await Offer.findOne({ _id: id, isDeleted: false });
  if (!offer) {
    const err = new Error("Offer not found.");
    err.statusCode = 404;
    throw err;
  }

  offer.name = name.trim();
  offer.offerType = offerType;
  offer.discountPercentage = Number(discountPercentage);
  offer.product = offerType === "PRODUCT" ? productId : null;
  offer.category = offerType === "CATEGORY" ? categoryId : null;
  offer.startDate = start;
  offer.endDate = end;

  await offer.save();
  return offer;
};

export const fetchAllOffers = async (query = {}) => {
  const { skip, limit, page } = getPagination(query, 10);
  const filter = { isDeleted: false };

  // 1. Search by offer name
  if (query.search?.trim()) {
    filter.name = { $regex: query.search.trim(), $options: "i" };
  }

  // 2. Filter by offer type (PRODUCT or CATEGORY)
  if (query.offerType && ["PRODUCT", "CATEGORY"].includes(query.offerType)) {
    filter.offerType = query.offerType;
  }

  // 3. Filter by status (active, inactive, expired)
  const now = new Date();
  if (query.status === "active") {
    filter.isActive = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  } else if (query.status === "inactive") {
    filter.isActive = false;
  } else if (query.status === "expired") {
    filter.endDate = { $lt: now };
  }

  // 4. Sorting logic
  let sortStage = { createdAt: -1 };
  if (query.sortBy === "oldest") {
    sortStage = { createdAt: 1 };
  } else if (query.sortBy === "discount-high") {
    sortStage = { discountPercentage: -1, createdAt: -1 };
  } else if (query.sortBy === "discount-low") {
    sortStage = { discountPercentage: 1, createdAt: -1 };
  }

  // 5. Query data and compute counts concurrently
  const [total, offers, totalAll, activeCount, expiredCount] =
    await Promise.all([
      Offer.countDocuments(filter),
      Offer.find(filter)
        .populate("product", "name")
        .populate("category", "name")
        .sort(sortStage)
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments({ isDeleted: false }),
      Offer.countDocuments({
        isDeleted: false,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Offer.countDocuments({ isDeleted: false, endDate: { $lt: now } }),
    ]);

  return formatPaginatedResponse(offers, total, page, limit, {
    stats: {
      total: totalAll,
      active: activeCount,
      expired: expiredCount,
    },
  });
};

export const toggleOfferStatus = async (id) => {
  const offer = await Offer.findOne({ _id: id, isDeleted: false });
  if (!offer) {
    const err = new Error("Offer not found.");
    err.statusCode = 404;
    throw err;
  }

  offer.isActive = !offer.isActive;
  await offer.save();
  return offer;
};

export const deleteOffer = async (id) => {
  const offer = await Offer.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, isActive: false },
    { new: true },
  );

  if (!offer) {
    const err = new Error("Offer not found.");
    err.statusCode = 404;
    throw err;
  }

  return offer;
};
