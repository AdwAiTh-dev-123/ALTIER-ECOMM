import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Offer from "../../models/Offer.js";
import { calculateBestOffer } from "../../utils/offerHelper.js";
import { getOrCreateCart } from "./getOrCreateCart.js";

export const addItemToCart = async ({
  userId,
  productId,
  variantId,
  quantity = 1,
}) => {
  const qty = Math.max(1, Number(quantity) || 1);

  const product = await Product.findOne({
    _id: productId,
    isListed: true,
    isDeleted: { $ne: true },
  }).populate("category");

  if (!product) {
    const err = new Error("This product is no longer available");
    err.statusCode = 404;
    throw err;
  }

  if (
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted
  ) {
    const err = new Error(
      "The category for this product is currently unavailable",
    );
    err.statusCode = 400;
    throw err;
  }

  const variant = await Variant.findOne({
    _id: variantId,
    product: productId,
    isListed: true,
    isDeleted: { $ne: true },
  });

  if (!variant) {
    const err = new Error("Item variant is no longer available");
    err.statusCode = 404;
    throw err;
  }

  if (variant.stock <= 0) {
    const err = new Error("This item is out of stock");
    err.statusCode = 400;
    throw err;
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const now = new Date();
  const activeOffers = await Offer.find({
    isActive: true,
    isDeleted: false,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { offerType: "PRODUCT", product: productId },
      { offerType: "CATEGORY", category: product.category?._id },
    ],
  }).lean();

  const { finalPrice } = calculateBestOffer({
    productId,
    categoryId: product.category?._id,
    originalPrice: variant.price,
    activeOffers,
  });

  const itemIndex = cart.items.findIndex(
    (item) => item.variant.toString() === variantId,
  );
  if (itemIndex > -1) {
    const newQty = cart.items[itemIndex].quantity + qty;
    if (newQty > variant.stock) {
      const err = new Error(`Only ${variant.stock} units available in stock`);
      err.statusCode = 400;
      throw err;
    }
    cart.items[itemIndex].quantity = newQty;
    cart.items[itemIndex].price = finalPrice;
  } else {
    if (qty > variant.stock) {
      const err = new Error(`Only ${variant.stock} units available in stock`);
      err.statusCode = 400;
      throw err;
    }
    cart.items.push({
      product: productId,
      variant: variantId,
      quantity: qty,
      price: finalPrice,
    });
  }
  await cart.save();
  return getOrCreateCart(userId);
};

export default addItemToCart;
