const Category = require("../../models/Category");
const { getPagination, formatPaginatedResponse } = require("../../utils/paginationHelper");

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

    category.isDeleted = true;
    category.isListed = false;
    await category.save()

    const [total, active, unlisted] = await Promise.all([
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Category.countDocuments({ isListed: true, isDeleted: { $ne: true } }),
      Category.countDocuments({ isListed: false, isDeleted: { $ne: true } }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Category ${category.name} deleted successfully`,
      stats: { total, active, unlisted },
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
    const {
      search = "",
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const { page, limit, skip } = getPagination(req.query, 10);

    const allowedSortFields = ["name", "createdAt", "isListed"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    const sortConfig = { [field]: order };

    const query = { isDeleted: { $ne: true } };


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

    const [categories, totalFilteredCategories, total, active, unlisted] =
      await Promise.all([
        Category.find(query).sort(sortConfig).skip(skip).limit(limit),
        Category.countDocuments(query),
        Category.countDocuments({ isDeleted: { $ne: true } }),
        Category.countDocuments({ isListed: true, isDeleted: { $ne: true } }),
        Category.countDocuments({ isListed: false, isDeleted: { $ne: true } }),
      ]);

    return res.status(200).json(
      formatPaginatedResponse({
        page,
        limit,
        totalItems: totalFilteredCategories,
        data: categories,
        extraFields: {
          stats: {
            total,
            active,
            unlisted,
          },
        },
      }),
    );
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

    const [total, active, unlisted] = await Promise.all([
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Category.countDocuments({ isListed: true, isDeleted: { $ne: true } }),
      Category.countDocuments({ isListed: false, isDeleted: { $ne: true } }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Category successfully ${category.isListed ? "Listed" : "Unlisted"}`,
      data: category,
      stats: { total, active, unlisted },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update category status",
      error: err.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {

    const { id } = req.params;
    const { name, description, isListed } = req.body;

    const category = await Category.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      })
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const existing = await Category.findOne({
        _id: { $ne: id },
        $or: [
          { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
          { slug }
        ],
        isDeleted: { $ne: true }
      })

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A category with this name already exists",
        })
      }

      category.name = trimmedName;
      category.slug = slug;
    }

    if (description !== undefined) {
      category.description = description.trim()
    }

    if (isListed !== undefined) {
      category.isListed = isListed
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: err.message,
    })

  }
}


module.exports = {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
  updateCategory,
};
