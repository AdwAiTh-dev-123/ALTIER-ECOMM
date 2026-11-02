import Order from "../../models/Order.js";

export const fetchAdminOrderById = async (id) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const query = isMongoId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };

  const order = await Order.findOne(query).populate("user", "name email phone");
  if (!order) {
    const err = new Error("Order record not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
};

export default fetchAdminOrderById;
