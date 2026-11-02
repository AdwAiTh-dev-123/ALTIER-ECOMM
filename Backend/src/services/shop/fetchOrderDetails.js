import Order from "../../models/Order.js";

export const fetchOrderDetails = async ({ orderId, user }) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(orderId);
  const query = isMongoId
    ? { $or: [{ orderId }, { _id: orderId }] }
    : { orderId };

  if (user.role !== "admin") {
    query.user = user._id;
  }

  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
};

export default fetchOrderDetails;
