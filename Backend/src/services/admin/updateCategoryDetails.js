import Category from "../../models/Category.js";

const createSlug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const updateCategoryDetails = async ({ id, name, description, isListed }) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  const trimmed = name.trim();
  const slug = createSlug(trimmed);

  const duplicate = await Category.findOne({
    _id: { $ne: id },
    $or: [{ name: { $regex: new RegExp(`^${trimmed}$`, "i") } }, { slug }],
  });

  if (duplicate) {
    const err = new Error("Another category with this name already exists");
    err.statusCode = 409;
    throw err;
  }

  category.name = trimmed;
  category.slug = slug;
  if (description !== undefined) category.description = description.trim();
  if (isListed !== undefined) category.isListed = isListed;

  await category.save();
  return category;
};

export default updateCategoryDetails;
