import mongoose from "mongoose";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Variant from "../../models/Variants.js";
import Product from "../../models/Products.js";
import Address from "../../models/Address.js";
import crypto from "crypto";
import { razorpayInstance } from "../../config/razorpay.js";

const generateOrderId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

export const createCodOrder = async (req, res) => {
  try {
    const { addressId } = req.body;
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Please select a shipping address",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Selected delivery address was not found",
      });
    }

    // 1. Populate both product and variant directly from cart items
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .populate("items.variant");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your bag is empty. Please add items before checking out.",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    // 2. Validate all items inside the loop
    for (const item of cart.items) {
      const variant = item.variant;
      const product = item.product;

      // If product or variant was deleted or unlisted
      if (
        !variant ||
        !product ||
        variant.isDeleted ||
        !variant.isListed ||
        product.isDeleted ||
        !product.isListed
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more items in your cart are no longer available. Please clear or update your cart.",
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name} (${variant.color} - ${variant.size})". Only ${variant.stock} left.`,
        });
      }

      const itemTotal = variant.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        variant: variant._id,
        title: product.name,
        color: variant.color,
        size: variant.size,
        image: variant.images?.[0] || "",
        price: variant.price,
        quantity: item.quantity,
        itemTotal,
      });
    }
    const shippingFee = subtotal >= 1500 ? 0 : 99;
    const totalAmount = subtotal + shippingFee;

    const decrementedItems = [];

    for (const item of orderItems) {
      const updated = await Variant.findOneAndUpdate(
        {
          _id: item.variant,
          stock: { $gte: item.quantity },
          isDeleted: false,
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!updated) {
        for (const prev of decrementedItems) {
          await Variant.findByIdAndUpdate(prev.variant, {
            $inc: { stock: prev.quantity },
          });
        }
        return res.status(400).json({
          success: false,
          message: `Stock for "${item.title}" just sold out. Please review your cart.`,
        });
      }

      decrementedItems.push({ variant: item.variant, quantity: item.quantity });
    }

    // 4. Create Order
    const newOrder = await Order.create({
      orderId: generateOrderId(),
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.streetAddress,
        apartment: address.apartment || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || "India",
      },
      pricing: {
        subtotal,
        shippingFee,
        totalAmount,
      },
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Confirmed",
      statusHistory: [
        {
          status: "Confirmed",
          timestamp: new Date(),
          comment: "Order placed successfully via Cash on Delivery",
          updatedBy: "Customer",
        },
      ],
    });

    // 5. Empty customer's cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: err.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = { orderId: id };
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: err.message,
    });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { addressId, retryOrderId } = req.body;

    let address;
    let orderItems = [];
    let subtotal = 0;
    let existingOrder = null;

    if (retryOrderId) {
      existingOrder = await Order.findOne({
        orderId: retryOrderId,
        user: req.user._id,
      });
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Original order record not found for retry.",
        });
      }
      if (existingOrder.paymentStatus === "Paid") {
        return res.status(400).json({
          success: false,
          message: "This order is already paid.",
        });
      }

      orderItems = existingOrder.items;
      subtotal = existingOrder.pricing.subtotal;

      for (const item of orderItems) {
        const variant = await Variant.findById(item.variant);
        if (
          !variant ||
          variant.isDeleted ||
          !variant.isListed ||
          variant.stock < item.quantity
        ) {
          return res.status(400).json({
            success: false,
            message: `Cannot retry: "${item.title}" is no longer in stock.`,
          });
        }
      }
    } else {
      // B. Fresh Order: Validate selected address and user cart
      if (!addressId) {
        return res.status(400).json({
          success: false,
          message: "Please select a delivery address",
        });
      }

      address = await Address.findOne({
        _id: addressId,
        user: req.user._id,
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found",
        });
      }

      const cart = await Cart.findOne({ user: req.user._id })
        .populate("items.product")
        .populate("items.variant");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Your bag is empty",
        });
      }
      for (const item of cart.items) {
        const variant = item.variant;
        const product = item.product;
        if (
          !variant ||
          !product ||
          variant.isDeleted ||
          !variant.isListed ||
          product.isDeleted ||
          !product.isListed
        ) {
          return res.status(400).json({
            success: false,
            message: "One or more items in your cart are no longer available.",
          });
        }

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${product.name}". Only ${variant.stock} left.`,
          });
        }
        const itemTotal = variant.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
          product: product._id,
          variant: variant._id,
          title: product.name,
          color: variant.color,
          size: variant.size,
          image: variant.images?.[0] || "",
          price: variant.price,
          quantity: item.quantity,
          itemTotal,
        });
      }
    }

    const shippingFee = subtotal >= 1500 ? 0 : 99;
    const totalAmount = subtotal + shippingFee;

    const razorpayOptions = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: existingOrder ? existingOrder.orderId : generateOrderId(),
    };

    const rzpOrder = await razorpayInstance.orders.create(razorpayOptions);

    let finalOrder;

    if (existingOrder) {
      // Re-use existing order record (update razorpay order id)
      existingOrder.razorpayDetails.orderId = rzpOrder.id;
      existingOrder.paymentStatus = "Pending";
      existingOrder.statusHistory.push({
        status: "Pending",
        timestamp: new Date(),
        comment: `Payment retry initiated (Razorpay Order: ${rzpOrder.id})`,
        updatedBy: "Customer",
      });

      finalOrder = await existingOrder.save();
    } else {
      // Save new Pending Order in MongoDB
      finalOrder = await Order.create({
        orderId: razorpayOptions.receipt,
        user: req.user._id,
        items: orderItems,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          streetAddress: address.streetAddress,
          apartment: address.apartment || "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country || "India",
        },

        pricing: {
          subtotal,
          shippingFee,
          totalAmount,
        },
        paymentMethod: "RAZORPAY",
        paymentStatus: "Pending",
        orderStatus: "Pending",
        razorpayDetails: {
          orderId: rzpOrder.id,
        },
        statusHistory: [
          {
            status: "Pending",
            timestamp: new Date(),
            comment: "Razorpay payment initiated",
            updatedBy: "Customer",
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: finalOrder.orderId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to initialize payment gateway",
      error: err.message,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;
    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }
    // 1. Verify HMAC SHA-256 signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message:
          "Cryptographic signature mismatch. Payment verification failed.",
      });
    }
    // 2. Fetch the corresponding internal order
    const order = await Order.findOne({
      orderId,
      user: req.user._id,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order record not found",
      });
    }
    // Idempotent guard: if already confirmed/paid, return success immediately
    if (order.paymentStatus === "Paid" && order.orderStatus === "Confirmed") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }
    // 3. Atomically decrement stock now that payment is guaranteed authentic
    const decrementedItems = [];
    for (const item of order.items) {
      const updated = await Variant.findOneAndUpdate(
        {
          _id: item.variant,
          stock: { $gte: item.quantity },
          isDeleted: false,
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
      if (!updated) {
        // Rollback any stock decremented earlier in this batch
        for (const prev of decrementedItems) {
          await Variant.findByIdAndUpdate(prev.variant, {
            $inc: { stock: prev.quantity },
          });
        }
        // If stock ran out during checkout, mark order for refund
        order.paymentStatus = "Paid";
        order.orderStatus = "Cancelled";
        order.statusHistory.push({
          status: "Cancelled",
          timestamp: new Date(),
          comment: `Stock sold out during payment. Refund initiated for Payment ID: ${razorpayPaymentId}`,
          updatedBy: "System",
        });
        await order.save();
        return res.status(400).json({
          success: false,
          message:
            "Stock ran out before payment verification could complete. A refund has been queued.",
        });
      }
      decrementedItems.push({ variant: item.variant, quantity: item.quantity });
    }
    // 4. Update order to Confirmed & Paid
    order.orderStatus = "Confirmed";
    order.paymentStatus = "Paid";
    order.razorpayDetails = {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    };
    order.statusHistory.push({
      status: "Confirmed",
      timestamp: new Date(),
      comment: `Online payment verified successfully (Payment ID: ${razorpayPaymentId})`,
      updatedBy: "System",
    });
    await order.save();
    // 5. Empty user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
    );
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
};
// 5. Record Payment Failure
export const handleRazorpayFailure = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const order = await Order.findOne({
      orderId,
      user: req.user._id,
    });
    if (order && order.paymentStatus !== "Paid") {
      order.paymentStatus = "Failed";
      order.statusHistory.push({
        status: "Pending",
        timestamp: new Date(),
        comment: `Payment attempt failed: ${reason || "Customer cancelled or bank failed"}`,
        updatedBy: "System",
      });
      await order.save();
    }
    return res.status(200).json({
      success: true,
      message: "Failure state recorded",
      orderId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to record payment failure",
      error: err.message,
    });
  }
};
