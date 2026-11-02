import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Category from '../../models/Category.js'
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";

export const fetchAllAdminProducts = async (query) => {
  const { skip, limit } = getPagination(query, 10);
  const filter = { isDeleted: { $ne: true } };

  if (query.search?.trim()) {
    filter.name = { $regex: query.search.trim(), $options: "i" };
  }

  if (query.category !== "all" && query.category?.trim()) {
    filter.category = query.category;
  }

  if (query.status === "listed") filter.isListed = true;
  if (query.status === "unlisted") filter.isListed = false;

  if (query.stock === "inStock" || query.stock === "outOfStock") {
    const inStockProductIds = await Variant.distinct("product", {
      isDeleted: { $ne: true },
      stock: { $gt: 0 },
    });
    if (query.stock === "inStock") {
      filter._id = { $in: inStockProductIds }
    }
    else {
      filter._id = { $nin: inStockProductIds }
    }
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sortStage =
    query.sortBy === "name"
      ? { name: sortDirection }
      : { createdAt: sortDirection };





  const [total, products, totalCatalog, listedCatalog, unlistedCatalog] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Product.countDocuments({ isDeleted: { $ne: true }, isListed: true }),
    Product.countDocuments({ isDeleted: { $ne: true }, isListed: false }),
  ])

  const productIds = products.map((p) => p._id);
  const variants = await Variant.find({
    product: { $in: productIds },
    isDeleted: { $ne: true },
  }).lean();

  const productsWithVariants = products.map((prod) => ({
    ...prod,
    variants: variants.filter(
      (v) => v.product.toString() === prod._id.toString(),
    ),
  }));

  return formatPaginatedResponse(
    productsWithVariants,
    total,
    query.page,
    limit,
    {
      stats: {
        total: totalCatalog,
        listed: listedCatalog,
        unlisted: unlistedCatalog,
      }
    }
  );
};

export default fetchAllAdminProducts;
