import Address from "../../models/Address.js";

export const setAsDefaultAddress = async ({ userId, addressId }) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const err = new Error("Address not found");
    err.statusCode = 404;
    throw err;
  }

  await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();
  return address;
};

export default setAsDefaultAddress;
