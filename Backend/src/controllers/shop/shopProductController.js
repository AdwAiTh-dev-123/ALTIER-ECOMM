import Product from "../../models/Products.js";
import Variant from "../../models/Variants.js";
import Category from "../../models/Category.js";
import {
  formatPaginatedResponse,
  getPagination,
} from "../../utils/paginationHelper.js";

const getStorefrontCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isListed: true,
      isDeleted: { $ne: true },
    })
      .select("name slug description")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: err.message,
    });
  }
};

const getStorefrontProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      minPrice,
      maxPrice,
      sortBy = "newest",
    } = req.query;
    const { page, limit, skip } = getPagination(req.query, 12);
    // 1. Fetch only active (listed and not soft-deleted) categories
    const activeCategories = await Category.find({
      isListed: true,
      isDeleted: { $ne: true },
    }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id);
    // 2. Build product criteria
    const productQuery = {
      isListed: true,
      isDeleted: { $ne: true },
      category: { $in: activeCategoryIds },
    };
    // Filter by specific category if requested
    if (category !== "all" && category.trim()) {
      productQuery.category = category;
    }
    // Backend text search by name or description
    if (search.trim()) {
      productQuery.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }
    // 3. Find matching products
    const products = await Product.find(productQuery)
      .populate("category", "name slug")
      .lean();
    if (!products.length) {
      return res.status(200).json(
        formatPaginatedResponse({
          page,
          limit,
          totalItems: 0,
          data: [],
        }),
      );
    }
    const productIds = products.map((p) => p._id);
    // 4. Query active variants for these products
    const variantQuery = {
      product: { $in: productIds },
      isListed: true,
      isDeleted: { $ne: true },
    };
    if (minPrice || maxPrice) {
      variantQuery.price = {};
      if (minPrice) variantQuery.price.$gte = Number(minPrice);
      if (maxPrice) variantQuery.price.$lte = Number(maxPrice);
    }
    const variants = await Variant.find(variantQuery).lean();
    // 5. Combine products with variants & filter out unavailable products
    let catalog = products
      .map((prod) => {
        const prodVariants = variants.filter(
          (v) => v.product.toString() === prod._id.toString(),
        );
        // Exclude products with no matching variants
        if (prodVariants.length === 0) return null;
        const totalStock = prodVariants.reduce((sum, v) => sum + v.stock, 0);
        const prices = prodVariants.map((v) => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        // Extract unique colors and sizes
        const availableColors = [...new Set(prodVariants.map((v) => v.color))];
        const availableSizes = [...new Set(prodVariants.map((v) => v.size))];
        // Gather all images from all variants, prioritizing first variant
        const allImages = prodVariants.flatMap((v) => v.images || []);
        return {
          _id: prod._id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          category: prod.category,
          price: minPrice,
          priceRange: { min: minPrice, max: maxPrice },
          totalStock,
          images:
            allImages.length > 0
              ? allImages
              : [
                  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
                ],
          variants: prodVariants,
          availableColors,
          availableSizes,
          createdAt: prod.createdAt,
        };
      })
      .filter(Boolean);
    // 6. Multi-field Sorting
    switch (sortBy) {
      case "price-asc":
        catalog.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        catalog.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        catalog.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        catalog.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
      default:
        catalog.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    // 7. Paginate the formatted array
    const totalItems = catalog.length;
    const paginatedItems = catalog.slice(skip, skip + limit);
    return res.status(200).json(
      formatPaginatedResponse({
        page,
        limit,
        totalItems,
        data: paginatedItems,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch storefront products",
      error: error.message,
    });
  }
};
/**
 * @desc    Get single product details with active variants and related items
 * @route   GET /api/products/:id
 * @access  Public
 */
const getStorefrontProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      isListed: true,
      isDeleted: { $ne: true },
    })
      .populate("category", "name slug isListed")
      .lean();
    if (!product || !product.category?.isListed) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently unavailable",
      });
    }
    // Fetch active variants
    const variants = await Variant.find({
      product: product._id,
      isListed: true,
      isDeleted: { $ne: true },
    }).lean();
    if (variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product has no available variants",
      });
    }
    // Collect all unique images across variants
    const allImages = [...new Set(variants.flatMap((v) => v.images || []))];
    // Fetch up to 4 related products in the same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isListed: true,
      isDeleted: { $ne: true },
    })
      .limit(4)
      .lean();
    const relatedProductIds = relatedProducts.map((p) => p._id);
    const relatedVariants = await Variant.find({
      product: { $in: relatedProductIds },
      isListed: true,
      isDeleted: { $ne: true },
    }).lean();
    const formattedRelated = relatedProducts.map((p) => {
      const vList = relatedVariants.filter(
        (v) => v.product.toString() === p._id.toString(),
      );
      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: vList[0]?.price || 0,
        images: vList[0]?.images || [],
      };
    });
    const variantPrices = variants.map((v) => Number(v.price)).filter((p) => !isNaN(p) && p > 0);
    const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        price: minPrice,
        variants,
        images:
          allImages.length > 0
            ? allImages
            : [
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
              ],
        relatedProducts: formattedRelated,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
};
export {
  getStorefrontCategories,
  getStorefrontProducts,
  getStorefrontProductById,
};
