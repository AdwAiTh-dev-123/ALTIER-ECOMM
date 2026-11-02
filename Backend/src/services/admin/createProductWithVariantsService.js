import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";

const generateSlug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const createProductWithVariantsService = async ({
  name,
  categoryId,
  description,
  variants,
}) => {
  const trimmedName = name.trim();
  const slug = `${generateSlug(trimmedName)}-${Date.now().toString().slice(-4)}`;

  const newProduct = await Product.create({
    name: trimmedName,
    slug,
    category: categoryId,
    description: description?.trim() || "",
    isListed: true,
  });

  const processedVariants = await Promise.all(
    variants.map(async (v) => {
      const uploadedImages = await Promise.all(
        (v.images || []).map((img) =>
          img.startsWith("http") ? img : uploadToCloudinary(img, "altier/products")
        )
      );

      return Variant.create({
        product: newProduct._id,
        color: v.color || "Standard",
        size: v.size || "M",
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        images: uploadedImages,
        sku: `${generateSlug(trimmedName).toUpperCase().slice(0, 4)}-${(v.color || "STD").slice(0, 3).toUpperCase()}-${v.size}-${Date.now().toString().slice(-4)}`,
        isListed: true,
      });
    })
  );

  return { product: newProduct, variants: processedVariants };
};

export default createProductWithVariantsService;
