import {
  fetchStorefrontCategoryList,
  fetchStorefrontProductsCatalog,
  fetchStorefrontProductById,
} from "../../services/shop/index.js";

export const getStorefrontCategories = async (req, res, next) => {
  try {
    const categories = await fetchStorefrontCategoryList();
    return res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

export const getStorefrontProducts = async (req, res, next) => {
  try {
    const result = await fetchStorefrontProductsCatalog(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getStorefrontProductById = async (req, res, next) => {
  try {
    const product = await fetchStorefrontProductById(req.params.id);
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
