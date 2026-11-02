import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Address from "../../models/Address.js";

export const processCodOrder = async ({ userId, addressId }) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const err = new Error("Delivery address not found.");
    err.statusCode = 404;
    throw err;
  }

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .populate("items.variant");

  if (!cart || cart.items.length === 0) {
    const err = new Error("Your shopping bag is empty.");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const { product, variant, quantity } = item;
    if (
      !variant ||
      variant.isDeleted ||
      !variant.isListed ||
      variant.stock < quantity
    ) {
      const err = new Error(
        `Item "${product?.name || "Selected product"}" is unavailable or has insufficient stock.`,
      );
      err.statusCode = 400;
      throw err;
    }

    subtotal += variant.price * quantity;
    orderItems.push({
      product: product._id,
      variant: variant._id,
      title: product.name,
      color: variant.color,
      size: variant.size,
      image: variant.images?.[0] || "",
      price: variant.price,
      quantity,
      itemTotal: variant.price * quantity,
    });
  }

  const shippingFee = subtotal >= 1500 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  // Atomic stock decrement
  for (const item of orderItems) {
    const updated = await Variant.findOneAndUpdate(
      { _id: item.variant, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );
    if (!updated) {
      const err = new Error(
        "Inventory changed during checkout. Please review your bag.",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await Order.create({
    orderId,
    user: userId,
    items: orderItems,
    shippingAddress: {
      ...address.toObject(),
      country: address.country || "India",
    },
    pricing: { subtotal, shippingFee, totalAmount },
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
  });

  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return order;
};

export default processCodOrder;
