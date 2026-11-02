import Product from "../../models/Product.js";

export const toggleProductListingStatus = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  product.isListed = !product.isListed;
  await product.save();
  return product;
};

export default toggleProductListingStatus;
