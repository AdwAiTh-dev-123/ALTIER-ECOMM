import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";

export const deleteProductAndVariants = async (id) => {
    const product = await Product.findById(id);
    if (!product) {
        const err = new Error("Product not found");
        err.statusCode = 404;
        throw err;
    }

    product.isDeleted = true;
    product.isListed = false;
    await product.save();

    await Variant.updateMany({ product: id }, { $set: { isDeleted: true, isListed: false } });
    return true;
};

export default deleteProductAndVariants;
