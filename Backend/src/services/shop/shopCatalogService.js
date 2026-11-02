import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Category from "../../models/Category.js";
import { getPagination, formatPaginatedResponse } from "../../utils/paginationHelper.js";

export const fetchStorefrontCategoryList = async () => {
    return Category.find({ isListed: true, isDeleted: { $ne: true } })
        .select("name slug description")
        .sort({ name: 1 })
        .lean();
};

export const fetchStorefrontProductsCatalog = async (query = {}) => {
    const { search = "", category = "all", sortBy = "newest", minPrice, maxPrice } = query;
    const { page, limit, skip } = getPagination(query, 12);

    const activeCategories = await Category.find({ isListed: true, isDeleted: { $ne: true } }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id);

    const productMatch = {
        isListed: true,
        isDeleted: { $ne: true },
    };

    if (category !== "all" && category?.trim()) {
        if (mongoose.isValidObjectId(category) && activeCategoryIds.some((id) => id.toString() === category.toString())) {
            productMatch.category = new mongoose.Types.ObjectId(category);
        } else {
            productMatch.category = new mongoose.Types.ObjectId();
        }
    } else {
        productMatch.category = { $in: activeCategoryIds };
    }

    if (search.trim()) {
        productMatch.$or = [
            { name: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
        ];
    }

    let sortStage = { createdAt: -1 };
    switch (sortBy) {
        case "price-asc":
        case "price-low":
            sortStage = { price: 1, createdAt: -1 };
            break;
        case "price-desc":
        case "price-high":
            sortStage = { price: -1, createdAt: -1 };
            break;
        case "name-asc":
            sortStage = { name: 1, createdAt: -1 };
            break;
        case "name-desc":
            sortStage = { name: -1, createdAt: -1 };
            break;
        case "newest":
        default:
            sortStage = { createdAt: -1 };
            break;
    }

    const pipeline = [
        { $match: productMatch },
        {
            $lookup: {
                from: "variants",
                let: { prodId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$product", "$$prodId"] },
                                    { $eq: ["$isListed", true] },
                                    { $ne: ["$isDeleted", true] },
                                ],
                            },
                        },
                    },
                ],
                as: "variants",
            },
        },
        {
            $addFields: {
                price: {
                    $cond: {
                        if: { $gt: [{ $size: "$variants" }, 0] },
                        then: { $min: "$variants.price" },
                        else: 0,
                    },
                },
                totalStock: { $sum: "$variants.stock" },
                images: {
                    $reduce: {
                        input: "$variants.images",
                        initialValue: [],
                        in: { $concatArrays: ["$$value", { $ifNull: ["$$this", []] }] },
                    },
                },
            },
        },
    ];

    const priceMatch = {};
    if (minPrice !== undefined && minPrice !== "" && !isNaN(minPrice)) {
        priceMatch.$gte = Math.max(0, Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(maxPrice)) {
        priceMatch.$lte = Math.max(0, Number(maxPrice));
    }
    if (Object.keys(priceMatch).length > 0) {
        pipeline.push({ $match: { price: priceMatch } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                "category.__v": 0,
                "category.createdAt": 0,
                "category.updatedAt": 0,
                "category.isListed": 0,
                "category.isDeleted": 0,
            },
        },
        { $sort: sortStage },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        }
    );

    const [facetResult] = await Product.aggregate(pipeline);
    const total = facetResult?.metadata?.[0]?.total || 0;
    const products = facetResult?.data || [];

    return formatPaginatedResponse(products, total, page, limit);
};

export const fetchStorefrontProductById = async (id) => {
    const product = await Product.findOne({ _id: id, isListed: true, isDeleted: { $ne: true } })
        .populate("category", "name slug")
        .lean();

    if (!product) {
        const err = new Error("Product not found");
        err.statusCode = 404;
        throw err;
    }

    const variants = await Variant.find({ product: id, isListed: true, isDeleted: { $ne: true } }).lean();
    return { ...product, variants };
};
