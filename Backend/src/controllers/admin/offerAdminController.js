import {
  createNewOffer,
  fetchAllOffers,
  updateExistingOffer,
  toggleOfferStatus,
  deleteOffer,
} from "../../services/admin/offerAdminService.js";

export const createOffer = async (req, res, next) => {
  try {
    const offer = await createNewOffer(req.body);
    return res.status(201).json({
      success: true,
      message: `Offer "${offer.name}" created successfully!`,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllOffers = async (req, res, next) => {
  try {
    const result = await fetchAllOffers(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const toggleOffer = async (req, res, next) => {
  try {
    const offer = await toggleOfferStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Offer is now ${offer.isActive ? "Active" : "Inactive"}.`,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const removeOffer = async (req, res, next) => {
  try {
    const offer = await deleteOffer(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully.",
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const offer = await updateExistingOffer(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: `Offer "${offer.name}" updated successfully!`,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};
