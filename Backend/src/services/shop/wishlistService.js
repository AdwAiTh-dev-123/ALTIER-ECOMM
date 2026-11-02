import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variant.js";
import Product from "../../models/Product.js";

export const fetchUserWishlist = async (userId) => {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
        path: "products",
        match: { isDeleted: { $ne: true } },
        select: "name slug description category isListed isDeleted",
        populate: { path: "category", select: "name" },
    });

    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const validProducts = (wishlist.products || []).filter(Boolean);
    const productIds = validProducts.map((p) => p._id);

    const variants = await Variant.find({
        product: { $in: productIds },
        isListed: true,
        isDeleted: { $ne: true },
    }).lean();

    return validProducts.map((prod) => {
        const prodVariants = variants.filter(
            (v) => v.product.toString() === prod._id.toString()
        );
        const allImages = prodVariants.flatMap((v) => v.images || []);
        const prices = prodVariants.map((v) => v.price);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const totalStock = prodVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

        const prodObj = prod.toObject ? prod.toObject() : prod;
        return {
            ...prodObj,
            images: allImages.length > 0 ? allImages : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
            price: minPrice,
            variants: prodVariants,
            totalStock,
        };
    });
};

export const toggleProductWishlist = async ({ userId, productId }) => {
    const product = await Product.findOne({ _id: productId, isDeleted: { $ne: true } });
    if (!product) {
        const err = new Error("Product not found");
        err.statusCode = 404;
        throw err;
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const index = wishlist.products.findIndex((p) => p.toString() === productId);
    const isAdded = index === -1;

    if (isAdded) {
        wishlist.products.push(productId);
    } else {
        wishlist.products.splice(index, 1);
    }

    await wishlist.save();
    return { isAdded, count: wishlist.products.length };
};

export const moveWishlistItemToCart = async ({ userId, productId, variantId }) => {
    const variant = await Variant.findOne({ _id: variantId, product: productId, isDeleted: { $ne: true } });
    if (!variant || variant.stock < 1) {
        const err = new Error("Selected item is currently out of stock");
        err.statusCode = 400;
        throw err;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existingIndex = cart.items.findIndex((item) => item.variant.toString() === variantId);
    if (existingIndex > -1) {
        cart.items[existingIndex].quantity += 1;
    } else {
        cart.items.push({ product: productId, variant: variantId, quantity: 1, price: variant.price });
    }
    await cart.save();

    // Remove from wishlist
    await Wishlist.findOneAndUpdate({ user: userId }, { $pull: { products: productId } });
    return cart;
};

export const clearEntireWishlist = async (userId) => {
    await Wishlist.findOneAndUpdate({ user: userId }, { $set: { products: [] } });
    return true;
};
