import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Address from "../../models/Address.js";
import Wallet from "../../models/Wallet.js";
import { getOrCreateWallet } from "./walletService.js";

export const processWalletOrder = async ({ userId, addressId }) => {
  const address = await Address.findOne({ _id: addressId, user: userId });

  if (!address) {
    const err = new Error("Delivery address not found");
    err.statusCode = 404;
    throw err;
  }

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .populate("items.variant");

  if (!cart || cart.items.length === 0) {
    const err = new Error("Your shipping bag is empty");
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

  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < totalAmount) {
    const err = new Error(
      `Insufficient wallet balance. Total is ₹${totalAmount}, but your wallet has ₹${wallet.balance}.`,
    );
    err.statusCode = 400;
    throw err;
  }

  const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const debitedWallet = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: totalAmount } },
    {
      $inc: { balance: -totalAmount },
      $push: {
        transactions: {
          type: "DEBIT",
          amount: totalAmount,
          description: `Payment for Order #${orderId}`,
          orderId,
          date: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!debitedWallet) {
    const err = new Error(
      "Insufficient wallet balance or transaction conflict. Please retry.",
    );
    err.statusCode = 400;
    throw err;
  }

  for (const item of orderItems) {
    const updated = await Variant.findOneAndUpdate(
      { _id: item.variant, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );

    if (!updated) {
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: totalAmount },
          $push: {
            transactions: {
              type: "CREDIT",
              amount: totalAmount,
              description: `Reversal for failed Order #${orderId}`,
              orderId,
              date: new Date(),
            },
          },
        },
      );

      const err = new Error(
        "Inventory changed during checkout.Yout wallet was not charged",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const order = await Order.create({
    orderId,
    user: userId,
    items: orderItems,
    shippingAddress: {
      ...address.toObject(),
      country: address.country || "India",
    },
    pricing: { subtotal, shippingFee, totalAmount },
    paymentMethod: "WALLET",
    paymentStatus: "Paid",
    orderStatus: "Confirmed",
    statusHistory: [
      {
        status: "Confirmed",
        timestamp: new Date(),
        comment: "Order paid via wallet",
        updatedBy: "System",
      },
    ],
  });

  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return order;
};
