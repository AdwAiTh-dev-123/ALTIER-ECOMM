import Category from "../../models/Category.js";

export const toggleCategoryListingStatus = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  category.isListed = !category.isListed;
  await category.save();

  const [total, active, unlisted] = await Promise.all([
    Category.countDocuments({ isDeleted: { $ne: true } }),
    Category.countDocuments({ isListed: true, isDeleted: { $ne: true } }),
    Category.countDocuments({ isListed: false, isDeleted: { $ne: true } }),
  ]);

  return { category, stats: { total, active, unlisted } };
};

export default toggleCategoryListingStatus;
