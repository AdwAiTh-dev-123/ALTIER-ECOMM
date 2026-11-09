import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Offer title is required"],
      trim: true,
    },
    offerType: {
      type: String,
      enum: ["PRODUCT", "CATEGORY"],
      required: [true, "Offer type must be either PRODUCT or CATEGORY"],
    },
    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount must be at least 1%"],
      max: [90, "Discount cannot exceed 90%"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    startDate: {
      type: Date,
      required: [true, "Offer start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Offer expiration date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

OfferSchema.index({
  offerType: 1,
  isActive: 1,
  isDeleted: 1,
  startDate: 1,
  endDate: 1,
});

export default mongoose.model("Offer", OfferSchema);
