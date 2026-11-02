import {
  fetchAllOrdersForAdmin,
  fetchAdminOrderById,
  updateOrderStatusWorkflow,
  reviewCustomerReturnRequest,
} from "../../services/admin/index.js";

export const getAllAdminOrders = async (req, res, next) => {
  try {
    const result = await fetchAllOrdersForAdmin(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrderById = async (req, res, next) => {
  try {
    const order = await fetchAdminOrderById(req.params.id);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const status = req.body.newStatus || req.body.status;
    const order = await updateOrderStatusWorkflow({
      id: req.params.id,
      status,
      comment: req.body.comment,
    });

    return res.status(200).json({
      success: true,
      message: `Order status successfully updated to "${status}".`,
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const reviewReturnRequest = async (req, res, next) => {
  try {
    const decision = req.body.decision || req.body.action;
    const adminNotes = req.body.adminNote || req.body.adminNotes;
    const order = await reviewCustomerReturnRequest({
      id: req.params.id,
      decision,
      adminNotes,
    });

    return res.status(200).json({
      success: true,
      message: `Return request processed successfully.`,
      order,
    });
  } catch (err) {
    next(err);
  }
};
