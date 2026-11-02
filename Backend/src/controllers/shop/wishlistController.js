import {
  fetchUserWishlist,
  toggleProductWishlist,
  moveWishlistItemToCart,
  clearEntireWishlist,
} from "../../services/shop/index.js";

export const getWishlist = async (req, res, next) => {
  try {
    const products = await fetchUserWishlist(req.user._id);
    return res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { isAdded, count } = await toggleProductWishlist({
      userId: req.user._id,
      productId: req.body.productId,
    });
    return res.status(200).json({
      success: true,
      message: isAdded ? "Added to wishlist" : "Removed from wishlist",
      isWishlisted: isAdded,
      count,
    });
  } catch (err) {
    next(err);
  }
};

export const moveToBag = async (req, res, next) => {
  try {
    const cart = await moveWishlistItemToCart({
      userId: req.user._id,
      productId: req.body.productId,
      variantId: req.body.variantId,
    });
    return res.status(200).json({ success: true, message: "Item moved to your bag", data: cart });
  } catch (err) {
    next(err);
  }
};

export const clearWishlist = async (req, res, next) => {
  try {
    await clearEntireWishlist(req.user._id);
    return res.status(200).json({ success: true, message: "Wishlist cleared successfully" });
  } catch (err) {
    next(err);
  }
};
