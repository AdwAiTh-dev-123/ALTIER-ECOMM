import Category from "../../models/Category.js";

export const softDeleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  category.isDeleted = true;
  category.isListed = false;
  await category.save();

  const [total, active, unlisted] = await Promise.all([
    Category.countDocuments({ isDeleted: { $ne: true } }),
    Category.countDocuments({ isListed: true, isDeleted: { $ne: true } }),
    Category.countDocuments({ isListed: false, isDeleted: { $ne: true } }),
  ]);

  return { categoryName: category.name, stats: { total, active, unlisted } };
};

export default softDeleteCategory;
