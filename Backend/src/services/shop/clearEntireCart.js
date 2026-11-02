import Cart from "../../models/Cart.js";

export const clearEntireCart = async (userId) => {
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return true;
};

export default clearEntireCart;
