export { processCodOrder } from "./processCodOrder.js";
export { initiateRazorpayOrder } from "./initiateRazorpayOrder.js";
export { verifyAndCompletePayment } from "./verifyAndCompletePayment.js";
export { recordPaymentFailure } from "./recordPaymentFailure.js";
export { fetchOrderDetails } from "./fetchOrderDetails.js";
export { fetchUserOrdersList } from "./fetchUserOrdersList.js";
export { cancelUserOrder } from "./cancelUserOrder.js";
export { requestOrderReturn } from "./requestOrderReturn.js";
export { getOrCreateCart } from "./getOrCreateCart.js";
export { addItemToCart } from "./addItemToCart.js";
export { updateCartItemQuantity } from "./updateCartItemQuantity.js";
export { removeCartItem } from "./removeCartItem.js";
export { clearEntireCart } from "./clearEntireCart.js";
export { getAddressesForUser } from "./getAddressesForUser.js";
export { createAddress } from "./createAddress.js";
export { updateAddressById } from "./updateAddressById.js";
export { deleteAddressById } from "./deleteAddressById.js";
export { setAsDefaultAddress } from "./setAsDefaultAddress.js";
export { cancelOrderItem } from "./cancelOrderItem.js";
export { requestOrderItemReturn } from "./requestOrderItemReturn.js";
export {
  fetchUserWishlist,
  toggleProductWishlist,
  moveWishlistItemToCart,
  clearEntireWishlist,
} from "./wishlistService.js";
export {
  fetchStorefrontCategoryList,
  fetchStorefrontProductsCatalog,
  fetchStorefrontProductById,
} from "./shopCatalogService.js";
