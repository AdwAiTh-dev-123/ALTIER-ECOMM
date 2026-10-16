const Category = require("../../models/Category");

const createCategory = async (req, res) => {
  try {
    const { name, description, isListed } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
        { slug },
      ],
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name exists",
      });
    }

    const category = await Category.create({
      name: trimmedName,
      description: description?.trim() || "",
      isListed: isListed,
      slug: slug,
    });

    return res.status(201).json({
      success: true,
      message: "Category created Successfully",
      data: category,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: err.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Category ${category.name} deleted successfully`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: err.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status === "active") {
      query.isListed = true;
    } else if (status === "unlisted") {
      query.isListed = false;
    }

    const categories = await Category.find(query).sort({ createdAt: -1 });

    const [total, active, unlisted] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isListed: true }),
      Category.countDocuments({ isListed: false }),
    ]);

    return res.status(200).json({
      success: true,
      count: categories.length,
      stats: [total, active, unlisted],
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

const toggleCategoryListing = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isListed = !category.isListed;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category successfully ${category.isListed ? "Listed" : "Unlisted"}`,
      data: category,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update category status",
      error: err.message,
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
};
