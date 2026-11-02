import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.js";

const generateSlug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const updateProductWithVariantsService = async ({
  id,
  name,
  description,
  categoryId,
  variants,
}) => {
  const product = await Product.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const trimmedName = name.trim();
  if (product.name !== trimmedName) {
    product.name = trimmedName;
    product.slug = `${generateSlug(trimmedName)}-${Date.now().toString().slice(-4)}`;
  }

  product.category = categoryId;
  product.description = description ? description.trim() : "";
  await product.save();

  const keptVariantIds = [];
  const updatedVariants = await Promise.all(
    variants.map(async (v) => {
      const uploadedImages = await Promise.all(
        (v.images || []).map((img) =>
          img.startsWith("http") ? img : uploadToCloudinary(img, "altier/products")
        )
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
            isListed: true,
          },
          { new: true }
        );
        keptVariantIds.push(v._id.toString());
        return updated;
      } else {
        const created = await Variant.create({
          product: product._id,
          color: v.color || "Standard",
          size: v.size || "M",
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          images: uploadedImages,
          sku: `${generateSlug(trimmedName).toUpperCase().slice(0, 4)}-${(v.color || "STD").slice(0, 3).toUpperCase()}-${v.size}-${Date.now().toString().slice(-4)}`,
          isListed: true,
        });
        keptVariantIds.push(created._id.toString());
        return created;
      }
    })
  );

  // Soft-delete removed variants
  const removedVariants = await Variant.find({
    product: product._id,
    _id: { $nin: keptVariantIds },
  });

  for (const removed of removedVariants) {
    removed.isDeleted = true;
    removed.isListed = false;
    await removed.save();
  }

  return { product, variants: updatedVariants };
};

export default updateProductWithVariantsService;
