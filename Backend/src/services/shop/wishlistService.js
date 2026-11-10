import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Product from "../../models/Product.js";

export const fetchUserWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId })
    .populate({
      path: "items.product",
      match: { isDeleted: { $ne: true } },
      select: "name slug description category isListed isDeleted",
      populate: { path: "category", select: "name" },
    })
    .populate({
      path: "items.variant",
      match: { isDeleted: { $ne: true } },
    });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  const validItems = (wishlist.items || []).filter((it) => it.product);

  return validItems.map((it) => {
    const prod = it.product.toObject ? it.product.toObject() : it.product;
    const variant = it.variant?.toObject ? it.variant.toObject() : it.variant;
    const variantImage = variant?.images?.[0] || prod.images?.[0];
    return {
      ...prod,
      wishlistItemId: it._id,
      selectedVariant: variant || null,
      variantId: variant?._id || null,
      images: variant?.images?.length ? variant.images : [variantImage],
      price: variant?.price || prod.price || 0,
      stock: variant?.stock ?? 0,
      isOutOfStock: (variant?.stock ?? 0) <= 0,
      size: variant?.size || "",
      color: variant?.color || "",
      variants: variant ? [variant] : [],
    };
  });
};

export const toggleProductWishlist = async ({
  userId,
  productId,
  variantId,
}) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: { $ne: true },
  });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [], products: [] });
  }

  let targetVariantId = variantId;
  if (!targetVariantId) {
    const firstVar = await Variant.findOne({
      product: productId,
      isListed: true,
      isDeleted: { $ne: true },
    });
    targetVariantId = firstVar?._id;
  }
  // Check if this specific product + variant is already saved
  const itemIndex = (wishlist.items || []).findIndex(
    (it) =>
      it.product?.toString() === productId.toString() &&
      (!targetVariantId ||
        it.variant?.toString() === targetVariantId.toString()),
  );
  const isAdded = itemIndex === -1;
  if (isAdded) {
    wishlist.items.push({
      product: productId,
      variant: targetVariantId || null,
    });
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }
  } else {
    wishlist.items.splice(itemIndex, 1);
    // If no more items for this product exist, remove from products array
    if (
      !wishlist.items.some(
        (it) => it.product?.toString() === productId.toString(),
      )
    ) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId.toString(),
      );
    }
  }
  await wishlist.save();
  return { isAdded, count: wishlist.items.length };
};

export const moveWishlistItemToCart = async ({
  userId,
  productId,
  variantId,
}) => {
  const variant = await Variant.findOne({
    _id: variantId,
    product: productId,
    isDeleted: { $ne: true },
  });
  if (!variant || variant.stock < 1) {
    const err = new Error("Selected item is currently out of stock");
    err.statusCode = 400;
    throw err;
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  const existingIndex = cart.items.findIndex(
    (item) => item.variant.toString() === variantId,
  );
  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += 1;
  } else {
    cart.items.push({
      product: productId,
      variant: variantId,
      quantity: 1,
      price: variant.price,
    });
  }
  await cart.save();

  // Remove from wishlist
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.items = (wishlist.items || []).filter(
      (it) =>
        !(
          it.product?.toString() === productId.toString() &&
          it.variant?.toString() === variantId.toString()
        ),
    );
    if (
      !wishlist.items.some(
        (it) => it.product?.toString() === productId.toString(),
      )
    ) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId.toString(),
      );
    }
    await wishlist.save();
  }
  return cart;
};

export const clearEntireWishlist = async (userId) => {
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $set: { items: [], products: [] } },
  );
  return true;
};
