import Product from "../../models/Products.js";
import Variant from "../../models/Variants.js";
import Category from "../../models/Category.js";
import {
  getPagination,
  formatPaginatedResponse,
} from "../../utils/paginationHelper.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../config/cloudinary.js";

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const getAllProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      status = "all",
      stock = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;
    const { skip, limit: pageLimit } = getPagination(req.query, 10);

    const query = { isDeleted: { $ne: true } };

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (category !== "all" && category && category.trim()) {
      query.category = category;
    }

    if (status === "listed") {
      query.isListed = true;
    } else if (status === "unlisted") {
      query.isListed = false;
    }

    if (stock === "inStock") {
      const inStockProductIds = await Variant.distinct("product", {
        stock: { $gt: 0 },
        isDeleted: { $ne: true },
      });
      query._id = { $in: inStockProductIds };
    } else if (stock === "outOfStock") {
      const inStockProductIds = await Variant.distinct("product", {
        stock: { $gt: 0 },
        isDeleted: { $ne: true },
      });
      query._id = { $nin: inStockProductIds };
    }

    const allowedSortFields = ["name", "createdAt"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder?.toLowerCase() === "asc" ? 1 : -1;
    const sortConfig = { [field]: order };

    const [
      products,
      totalCount,
      totalProducts,
      listedProducts,
      unlistedProducts,
    ] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortConfig)
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Product.countDocuments(query),
      Product.countDocuments({ isDeleted: { $ne: true } }),
      Product.countDocuments({ isDeleted: { $ne: true }, isListed: true }),
      Product.countDocuments({ isDeleted: { $ne: true }, isListed: false }),
    ]);

    const productIds = products.map((p) => p._id);
    const variants = await Variant.find({
      product: { $in: productIds },
    }).lean();

    const productWithVarients = products.map((product) => ({
      ...product,
      variants: variants.filter(
        (v) => v.product.toString() === product._id.toString(),
      ),
    }));

    return res.status(200).json(
      formatPaginatedResponse({
        page,
        limit: pageLimit,
        totalItems: totalCount,
        data: productWithVarients,
        extraFields: {
          stats: {
            total: totalProducts,
            listed: listedProducts,
            unlisted: unlistedProducts,
          },
        },
      }),
    );
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

const createProductWithVariants = async (req, res) => {
  try {
    const { name, categoryId, description, variants } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Atleast one varient is required",
      });
    }

    const slug =
      generateSlug(name.trim()) + "-" + Date.now().toString().slice(-4);

    const newProduct = await Product.create({
      name: name.trim(),
      slug,
      category: categoryId,
      description: description?.trim() || "",
      isListed: true,
    });

    const processedVariants = await Promise.all(
      variants.map(async (v, index) => {
        const uploadedImages = await Promise.all(
          (v.images || []).map((img) =>
            uploadToCloudinary(img, "altier/products"),
          ),
        );

        return {
          product: newProduct._id,
          color: v.color || "Standard",
          size: v.size || "M",
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          images: uploadedImages,
          sku: `${generateSlug(name).toUpperCase().slice(0, 4)}-${v.color?.slice(0, 3).toUpperCase()}-${v.size}-${index + 1}`,
          isListed: true,
        };
      }),
    );

    const createdVarients = await Variant.insertMany(processedVariants);

    return res.status(201).json({
      success: true,
      message: "Product and varients created successfully",
      data: {
        product: newProduct,
        varients: createdVarients,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variants = await Variant.find({ product: id });
    const allImages = variants.flatMap((v) => v.images || []);

    await Promise.all(allImages.map((imgUrl) => deleteFromCloudinary(imgUrl)));

    await Product.findByIdAndDelete(id);

    await Variant.deleteMany({ product: id });

    return res.status(200).json({
      success: true,
      message: "Product and associated variants deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

const toggleProductListing = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isListed = !product.isListed;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product is now ${product.isListed ? "Listed" : "Unlisted"}`,
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  }
};

const updateProductWithVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, variants } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const trimmedName = name.trim();

    if (product.name !== trimmedName) {
      product.name = trimmedName;
      product.slug =
        generateSlug(trimmedName) + "-" + Date.now().toString().slice(-4);
    }

    product.category = categoryId;
    product.description = description ? description.trim() : "";

    await product.save();

    // Fetch existing variants before updating to track removed images
    const currentVariants = await Variant.find({ product: product._id });
    const currentImages = currentVariants.flatMap((v) => v.images || []);

    const keptVariantIds = [];

    const updatedVariants = await Promise.all(
      variants.map(async (v, index) => {
        const uploadedImages = await Promise.all(
          (v.images || []).map((img) =>
            uploadToCloudinary(img, "altier/products"),
          ),
        );

        const isExisting = v._id && v._id.toString().match(/^[0-9a-fA-F]{24}$/);

        if (isExisting) {
          const updated = await Variant.findByIdAndUpdate(
            v._id,
            {
              color: v.color || "Standard",
              size: v.size || "M",
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
              images: uploadedImages,
              sku: `${generateSlug(trimmedName).toUpperCase().slice(0, 4)}-${v.color?.slice(0, 3).toUpperCase()}-${v.size}-${Date.now().toString().slice(-4)}`,
              isListed: true,
            },
            { new: true },
          );

          keptVariantIds.push(v._id);
          return updated;
        } else {
          const created = await Variant.create({
            product: product._id,
            color: v.color || "Standard",
            size: v.size || "M",
            price: Number(v.price) || 0,
            stock: Number(v.stock) || 0,
            images: uploadedImages,
            sku: `${generateSlug(trimmedName).toUpperCase().slice(0, 4)}-${v.color?.slice(0, 3).toUpperCase()}-${v.size}-${Date.now().toString().slice(-4)}`,
            isListed: true,
          });

          keptVariantIds.push(created._id);
          return created;
        }
      }),
    );

    // Identify images present across updated variants
    const activeImages = updatedVariants.flatMap((v) => v.images || []);

    // Find and delete removed images from Cloudinary
    const removedImages = currentImages.filter((img) => !activeImages.includes(img));
    await Promise.all(removedImages.map((img) => deleteFromCloudinary(img)));

    await Variant.deleteMany({
      product: product._id,
      _id: { $nin: keptVariantIds },
    });

    return res.status(200).json({
      success: true,
      message: "product updated successfully",
      data: {
        product,
        variants: updatedVariants,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message,
    });
  }
};

export {
  toggleProductListing,
  createProductWithVariants,
  getAllProducts,
  updateProductWithVariants,
  deleteProduct,
};
