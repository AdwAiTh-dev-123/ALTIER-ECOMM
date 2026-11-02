import Category from "../../models/Category.js";

const createSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const createNewCategory = async ({ name, description, isListed }) => {
  const trimmed = name.trim();
  const slug = createSlug(trimmed);

  const existing = await Category.findOne({
    $or: [{ name: { $regex: new RegExp(`^${trimmed}$`, "i") } }, { slug }],
  });

  if (existing) {
    const err = new Error("A category with this name already exists");
    err.statusCode = 409;
    throw err;
  }

  return Category.create({
    name: trimmed,
    description: description?.trim() || "",
    isListed: isListed ?? true,
    slug,
  });
};

export default createNewCategory;
