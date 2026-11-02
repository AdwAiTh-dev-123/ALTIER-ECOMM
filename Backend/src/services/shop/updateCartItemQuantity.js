import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import { getOrCreateCart } from "./getOrCreateCart.js";

export const updateCartItemQuantity = async ({
  userId,
  variantId,
  quantity,
}) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.variant.toString() === variantId,
  );

  if (itemIndex === -1) {
    const err = new Error("Item not found in your cart");
    err.statusCode = 404;
    throw err;
  }

  const variant = await Variant.findById(variantId);
  if (!variant || variant.stock < quantity) {
    const err = new Error(`Only ${variant?.stock || 0} units available`);
    err.statusCode = 400;
    throw err;
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  return getOrCreateCart(userId);
};

export default updateCartItemQuantity;
