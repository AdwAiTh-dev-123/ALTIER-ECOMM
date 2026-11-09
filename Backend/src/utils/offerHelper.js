export const calculateBestOffer = ({
  productId,
  categoryId,
  originalPrice,
  activeOffers = [],
}) => {
  const prodIdStr = productId?.toString();
  const catIdStr = categoryId?.toString();
  const basePrice = Math.max(0, Number(originalPrice) || 0);

  const productOffer = activeOffers.find(
    (offer) =>
      offer.offerType === "PRODUCT" && offer.product?.toString() === prodIdStr,
  );

  const categoryOffer = activeOffers.find(
    (offer) =>
      offer.offerType === "CATEGORY" && offer.category?.toString() === catIdStr,
  );

  const prodDiscount = productOffer ? productOffer.discountPercentage : 0;
  const catDiscount = categoryOffer ? categoryOffer.discountPercentage : 0;

  let winningOffer = null;
  let winningDiscount = 0;

  if (prodDiscount > 0 && prodDiscount >= catDiscount) {
    winningOffer = productOffer;
    winningDiscount = prodDiscount;
  } else if (catDiscount > 0 && catDiscount > prodDiscount) {
    winningOffer = categoryOffer;
    winningDiscount = catDiscount;
  }

  // 4. Calculate discounted final price
  const discountAmount = Math.round((basePrice * winningDiscount) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    originalPrice: basePrice,
    finalPrice,
    discountPercentage: winningDiscount,
    discountAmount,
    hasOffer: winningDiscount > 0,
    appliedOffer: winningOffer
      ? {
          _id: winningOffer._id,
          name: winningOffer.name,
          offerType: winningOffer.offerType,
          discountPercentage: winningDiscount,
        }
      : null,
  };
};
