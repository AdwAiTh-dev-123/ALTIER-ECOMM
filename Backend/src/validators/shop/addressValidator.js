import mongoose from "mongoose";

export const validateAddressInput = (req, res, next) => {
  const {
    fullName,
    phone,
    streetAddress,
    city,
    state,
    postalCode,
    addressType,
  } = req.body;

  if (!fullName || !phone || !streetAddress || !city || !state || !postalCode) {
    return res.status(400).json({
      success: false,
      message:
        "Full name, phone, street address, city, state, and postal code are all required.",
    });
  }

  const phoneStr = String(phone).replace(/[\s-]/g, "").trim();
  if (!/^[6-9]\d{9}$/.test(phoneStr)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 10-digit mobile number.",
    });
  }

  const postalCodeStr = String(postalCode).trim()
  if (!/^\d{6}$/.test(postalCodeStr)) {
    return res.status(400).json({
      success: false,
      message: "Postal code must be a valid 6-digit PIN code.",
    });
  }

  if (addressType) {
    const formattedType = addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase();
    if (!["Home", "Work", "Other"].includes(formattedType)) {
      return res.status(400).json({
        success: false,
        message: "Address type must be Home, Work, or Other.",
      });
    }
    req.body.addressType = formattedType;
  }

  req.body.phone = phoneStr;
  req.body.postalCode = Number(postalCodeStr);
  req.body.fullName = String(fullName).trim()
  next();
};

export const validateAddressIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid address ID parameter.",
    });
  }
  next();
};
