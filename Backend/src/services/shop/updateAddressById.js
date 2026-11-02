import Address from "../../models/Address.js";

export const updateAddressById = async ({ userId, addressId, updateData }) => {
  const existing = await Address.findOne({ _id: addressId, user: userId });
  if (!existing) {
    const err = new Error("Address not found");
    err.statusCode = 404;
    throw err;
  }

  if (updateData.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } },
    );
  }

  return Address.findByIdAndUpdate(
    addressId,
    { $set: updateData },
    { new: true, runValidators: true },
  );
};

export default updateAddressById;
