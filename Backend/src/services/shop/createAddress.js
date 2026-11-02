import Address from "../../models/Address.js";

export const createAddress = async ({ userId, addressData }) => {
  const count = await Address.countDocuments({ user: userId });
  const shouldBeDefault = count === 0 || Boolean(addressData.isDefault);

  if (shouldBeDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  return Address.create({
    user: userId,
    fullName: addressData.fullName,
    phone: addressData.phone,
    streetAddress: addressData.streetAddress,
    apartment: addressData.apartment || "",
    city: addressData.city,
    state: addressData.state,
    postalCode: addressData.postalCode,
    country: addressData.country || "India",
    addressType: addressData.addressType || "Home",
    isDefault: shouldBeDefault,
  });
};

export default createAddress;
