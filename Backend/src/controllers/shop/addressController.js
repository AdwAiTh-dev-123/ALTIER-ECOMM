import {
  getAddressesForUser,
  createAddress,
  updateAddressById,
  deleteAddressById,
  setAsDefaultAddress,
} from "../../services/shop/index.js";

export const getUserAddresses = async (req, res, next) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(200).json({
        success: true,
        addresses: [],
        message: "Admin accounts do not have delivery addresses",
      });
    }

    const addresses = await getAddressesForUser(req.user._id);
    return res.status(200).json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot create delivery addresses",
      });
    }

    const address = await createAddress({
      userId: req.user._id,
      addressData: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot manage delivery addresses",
      });
    }

    const updated = await updateAddressById({
      userId: req.user._id,
      addressId: req.params.id,
      updateData: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    await deleteAddressById({
      userId: req.user._id,
      addressId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await setAsDefaultAddress({
      userId: req.user._id,
      addressId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (err) {
    next(err);
  }
};
