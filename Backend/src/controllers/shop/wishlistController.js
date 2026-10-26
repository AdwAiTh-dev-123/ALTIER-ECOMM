const Wishlist = require("../../models/Wishlist");
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variants");

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({
      user: req.user._id,
    }).populate({
      path: "products",
      match: { isDeleted: { $ne: true } },
      select: "name slug description category isListed isDeleted",
      populate: { path: "category", select: "name" },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [],
      });
    }

    const validProducts = (wishlist.products || []).filter(Boolean);
    const productIds = validProducts.map((p) => p._id);

    // Fetch active variants for wishlisted products to enrich images, pricing, and stock
    const variants = await Variant.find({
      product: { $in: productIds },
      isListed: true,
      isDeleted: { $ne: true },
    }).lean();

    const enrichedProducts = validProducts.map((prod) => {
      const prodVariants = variants.filter(
        (v) => v.product.toString() === prod._id.toString(),
      );
      const allImages = prodVariants.flatMap((v) => v.images || []);
      const prices = prodVariants.map((v) => v.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const totalStock = prodVariants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0,
      );

      const prodObj = prod.toObject ? prod.toObject() : prod;
      return {
        ...prodObj,
        images:
          allImages.length > 0
            ? allImages
            : [
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
              ],
        price: minPrice,
        variants: prodVariants,
        totalStock,
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedProducts,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: err.message,
    });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => (p._id ? p._id.toString() : p.toString()) === String(productId),
    );
    let added = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
      added = true;
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: added ? "Added to wishlist" : "Removed from wishlist",
      isWishlisted: added,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const moveToBag = async (req, res) => {
  try {
    const { productId, variantId } = req.body;

    const variant = await Variant.findById(variantId);
    if (!variant || variant.stock <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Item is out of stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const itemIndex = cart.items.findIndex(
      (i) => i.variant.toString() === variantId,
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + 1;
      if (newQty > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} units available in stock`,
        });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity: 1,
        price: variant.price,
      });
    }

    await cart.save();

    await Wishlist.updateOne(
      { user: req.user._id },
      { $pull: { products: productId } },
    );

    return res.status(200).json({
      success: true,
      message: "Garment moved to bag",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { products: [] } },
    );

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { getWishlist, toggleWishlist, moveToBag, clearWishlist };
