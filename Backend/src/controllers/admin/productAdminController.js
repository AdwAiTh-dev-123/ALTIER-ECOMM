import {
  fetchAllAdminProducts,
  createProductWithVariantsService,
  updateProductWithVariantsService,
  toggleProductListingStatus,
  deleteProductAndVariants,
} from "../../services/admin/index.js";

const getAllProducts = async (req, res, next) => {
  try {
    const result = await fetchAllAdminProducts(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createProductWithVariants = async (req, res, next) => {
  try {
    const { name, categoryId, description, variants } = req.body;
    const result = await createProductWithVariantsService({
      name,
      categoryId,
      description,
      variants,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const updateProductWithVariants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description, variants } = req.body;
    const result = await updateProductWithVariantsService({
      id,
      name,
      description,
      categoryId,
      variants,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const toggleProductListing = async (req, res, next) => {
  try {
    const product = await toggleProductListingStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Product is now ${product.isListed ? "Listed" : "Unlisted"}`,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await deleteProductAndVariants(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Product and associated variants deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export {
  getAllProducts,
  createProductWithVariants,
  updateProductWithVariants,
  toggleProductListing,
  deleteProduct,
};
