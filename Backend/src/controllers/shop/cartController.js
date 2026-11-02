import {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearEntireCart,
} from "../../services/shop/index.js";

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    return res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrators cannot add items to cart",
      });
    }

    const { productId, variantId, quantity } = req.body;
    const cart = await addItemToCart({
      userId: req.user._id,
      productId,
      variantId,
      quantity,
    });

    return res.status(200).json({
      success: true,
      message: "Item added to bag successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const updateCartQuantity = async (req, res, next) => {
  try {
    const { variantId, quantity } = req.body;
    const cart = await updateCartItemQuantity({
      userId: req.user._id,
      variantId,
      quantity,
    });

    return res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await removeCartItem({
      userId: req.user._id,
      variantId: req.params.variantId,
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from bag",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await clearEntireCart(req.user._id);
    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (err) {
    next(err);
  }
};

export {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
