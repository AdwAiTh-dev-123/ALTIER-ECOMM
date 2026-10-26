const Cart = require("../../models/Cart");
const Product = require("../../models/Products");
const Variant = require("../../models/Variants");

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "name slug isListed isDeleted images",
      })
      .populate({
        path: "items.variant",
        select: "color size price stock images isListed isDeleted sku",
      });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get cart items",
      error: err.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);

    const variant = await Variant.findOne({
      _id: variantId,
      product: productId,
      isListed: true,
      isDeleted: { $ne: true },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Item is no longer available",
      });
    }

    if (variant.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "This item is out of stock",
      });
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId,
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;

      if (newQty > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} units available in stock`,
        });
      }

      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = variant.price;
    } else {
      if (qty > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} units available in stock`,
        });
      }

      cart.items.push({
        product: productId,
        variant: variantId,
        quantity: qty,
        price: variant.price,
      });
    }

    await cart.save();
    return getCart(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to add to cart",
      error: err.message,
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;
    const targetQty = Number(quantity);

    const variant = await Variant.findById(variantId);

    if (!variant || variant.stock < targetQty) {
      return res.status(400).json({
        success: false,
        message: "Requested stock not available",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not in bag",
      });
    }

    if (targetQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = targetQty;
    }

    await cart.save();
    return getCart(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not update cart",
      error: err.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { variantId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.variant.toString() !== variantId,
    );

    await cart.save();
    return getCart(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not remove item from cart",
      error: err.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return getCart(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not clear cart",
      error: err.message,
    });
  }
};

module.exports = {
  getCart,
  removeFromCart,
  updateCartQuantity,
  addToCart,
  clearCart,
};

