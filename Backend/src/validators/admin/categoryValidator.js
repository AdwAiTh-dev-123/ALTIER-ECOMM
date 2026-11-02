import mongoose from "mongoose";

export const validateCategoryInput = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Category name must be between 2 and 50 characters.",
    });
  }

  req.body.name = trimmedName;
  if (description) {
    req.body.description = description.trim();
  }

  next();
};

export const validateCategoryIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID.",
    });
  }
  next();
};
