import Cart from "../../models/Cart.js";

export const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.product",
      select: "name slug isListed isDeleted images",
    })
    .populate({
      path: "items.variant",
      select: "color size price stock images isListed isDeleted sku",
    });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

export default getOrCreateCart;
