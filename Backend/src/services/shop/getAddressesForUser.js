import Address from "../../models/Address.js";

export const getAddressesForUser = async (userId) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

export default getAddressesForUser;
