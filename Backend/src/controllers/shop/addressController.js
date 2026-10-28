import Address from "../../models/Address.js";

export const getUserAddresses = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(200).json({
        success: true,
        addresses: [],
        message: "Admin accounts do not have delivery addresses",
      });
    }

    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get user addresses",
      error: err.message,
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot create delivery addresses",
      });
    }
    const {
      fullName,
      phone,
      streetAddress,
      apartment,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !streetAddress ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    const count = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = count === 0 || Boolean(isDefault);

    if (shouldBeDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } },
      );
    }

    const newAddress = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      streetAddress,
      apartment: apartment || "",
      city,
      state,
      postalCode,
      country: country || "India",
      addressType: addressType || "Home",
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address: newAddress,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: err.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot manage delivery addresses",
      });
    }
    const { id } = req.params;
    const { isDefault } = req.body;

    const existing = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: id } },
        { $set: { isDefault: false } },
      );
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: err.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot manage delivery addresses",
      });
    }
    const { id } = req.params;
    const deleted = await Address.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
    if (deleted.isDefault) {
      const fallback = await Address.findOne({ user: req.user._id }).sort({
        createdAt: -1,
      });
      if (fallback) {
        fallback.isDefault = true;
        await fallback.save();
      }
    }
    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot manage delivery addresses",
      });
    }
    const { id } = req.params;
    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } },
    );
    address.isDefault = true;
    await address.save();
    return res.status(200).json({
      success: true,
      message: "Default address updated",
      address,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
