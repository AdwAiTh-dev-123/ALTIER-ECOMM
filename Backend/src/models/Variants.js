const mongoose = require("mongoose");

const VariantSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
    },
    price: {
      type: Number,
      required: true,
      min: 10,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      trim: true,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Variant", VariantSchema);
