import {
  createNewCategory,
  fetchAllCategories,
  updateCategoryDetails,
  toggleCategoryListingStatus,
  softDeleteCategory,
} from "../../services/admin/index.js";

const createCategory = async (req, res, next) => {
  try {
    const { name, description, isListed } = req.body;
    const category = await createNewCategory({ name, description, isListed });
    return res.status(201).json({
      success: true,
      message: "Category created Successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const result = await fetchAllCategories(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const toggleCategoryListing = async (req, res, next) => {
  try {
    const { category, stats } = await toggleCategoryListingStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Category successfully ${category.isListed ? "Listed" : "Unlisted"}`,
      data: category,
      stats,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { categoryName, stats } = await softDeleteCategory(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Category ${categoryName} deleted successfully`,
      stats,
    });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isListed } = req.body;
    const category = await updateCategoryDetails({
      id,
      name,
      description,
      isListed,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

export {
  createCategory,
  getAllCategories,
  toggleCategoryListing,
  deleteCategory,
  updateCategory,
};
