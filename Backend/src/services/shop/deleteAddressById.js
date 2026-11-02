import Address from "../../models/Address.js";

export const deleteAddressById = async ({ userId, addressId }) => {
  const existing = await Address.findOne({ _id: addressId, user: userId });
  if (!existing) {
    const err = new Error("Address not found");
    err.statusCode = 404;
    throw err;
  }

  await Address.findByIdAndDelete(addressId);

  if (existing.isDefault) {
    const newest = await Address.findOne({ user: userId }).sort({
      createdAt: -1,
    });
    if (newest) {
      newest.isDefault = true;
      await newest.save();
    }
  }

  return true;
};

export default deleteAddressById;
