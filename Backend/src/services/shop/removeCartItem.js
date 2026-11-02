import Cart from "../../models/Cart.js";
import { getOrCreateCart } from "./getOrCreateCart.js";

export const removeCartItem = async ({ userId, variantId }) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  cart.items = cart.items.filter(
    (item) => item.variant.toString() !== variantId,
  );
  await cart.save();
  return getOrCreateCart(userId);
};

export default removeCartItem;
