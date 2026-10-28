import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getCartApi,
  addToCartApi,
  updateCartQuantityApi,
  removeFromCartApi,
  clearCartApi,
} from "../api/shopApi";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  const [cartItems, setCartItems] = useState([]);
  const [cartToast, setCartToast] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Helper to normalize raw database cart items into component-friendly format
   */
  const formatCartItems = useCallback((items = []) => {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && (item.variant || item.product))
      .map((item) => {
        const variant =
          typeof item.variant === "object" && item.variant !== null
            ? item.variant
            : {};
        const product =
          typeof item.product === "object" && item.product !== null
            ? item.product
            : {};
        const variantId = String(variant._id || item.variant || "");
        const productId = String(product._id || item.product || "");
        const isListed = Boolean(
          product &&
          product.isListed !== false &&
          !product.isDeleted &&
          variant &&
          variant.isListed !== false &&
          !variant.isDeleted,
        );

        return {
          cartItemId: variantId || String(item._id),
          productId,
          title: product.name || product.title || "Garment",
          slug: product.slug || "",
          image: variant.images?.[0] || product.images?.[0] || "",
          variantId,
          color: variant.color || "",
          size: variant.size || "",
          sku: variant.sku || "",
          price: Number(item.price ?? variant.price ?? 0),
          stock: Number(variant.stock ?? 0),
          quantity: Number(item.quantity ?? 1),
          isListed,
        };
      });
  }, []);

  /**
   * Fetch authenticated user's cart from MongoDB
   */
  const fetchCart = useCallback(async () => {
    if (!userId || user?.role === "admin") {
      setCartItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await getCartApi();
      const items = res.data?.data?.items || [];
      setCartItems(formatCartItems(items));
    } catch (err) {
      console.error("Failed to load user cart from database:", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, formatCartItems]);

  // Load database cart whenever authenticated user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Auto-clear toast notification after 3.5 seconds
  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => setCartToast(null), 3500);
    return () => clearTimeout(timer);
  }, [cartToast]);

  /**
   * Add garment variant to MongoDB cart
   */
  const addToCart = async (product, selectedVariant, quantity = 1) => {
    if (!userId) {
      setCartToast({
        type: "error",
        message: "Please sign in to add garments to your bag.",
      });
      return false;
    }

    if (user?.role === "admin") {
      setCartToast({
        type: "error",
        message: "Administrators cannot add garments to bag.",
      });
      return false;
    }

    if (!selectedVariant || !selectedVariant._id) {
      setCartToast({
        type: "error",
        message: "Please select a garment variant.",
      });
      return false;
    }

    try {
      const res = await addToCartApi(
        product._id,
        selectedVariant._id,
        quantity,
      );
      const updatedItems = res.data?.data?.items || [];
      setCartItems(formatCartItems(updatedItems));
      setCartToast({
        type: "success",
        message: `Added ${product.name || product.title} (${selectedVariant.color}, ${selectedVariant.size}) to your bag.`,
      });
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to add item to bag.";
      setCartToast({ type: "error", message });
      return false;
    }
  };

  /**
   * Update quantity directly in MongoDB
   */
  const updateCartQuantity = async (cartItemId, newQty) => {
    if (!userId) return;

    if (newQty <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const res = await updateCartQuantityApi(cartItemId, newQty);
      const updatedItems = res.data?.data?.items || [];
      setCartItems(formatCartItems(updatedItems));
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not update quantity in bag.";
      setCartToast({ type: "error", message });
    }
  };

  /**
   * Remove item from MongoDB cart
   */
  const removeFromCart = async (cartItemId) => {
    if (!userId) return;

    try {
      const res = await removeFromCartApi(cartItemId);
      const updatedItems = res.data?.data?.items || [];
      setCartItems(formatCartItems(updatedItems));
      setCartToast({
        type: "info",
        message: "Item removed from your bag.",
      });
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to remove item from bag.";
      setCartToast({ type: "error", message });
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    if (!userId) return;
    try {
      await clearCartApi();
      setCartItems([]);
      setCartToast({ type: "info", message: "Your bag has been cleared." });
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  // Calculations
  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getTotalCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const getShippingFee = () => {
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 1500 ? 0 : 90; // Free pan-India shipping over 1500
  };

  const getTotalAmount = () => {
    return getSubtotal() + getShippingFee();
  };

  const hasInvalidItems = () => {
    return cartItems.some(
      (item) => !item.isListed || item.quantity > item.stock || item.stock <= 0,
    );
  };

  const hasUnlistedItems = () => {
    return cartItems.some((item) => !item.isListed);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getSubtotal,
        getTotalCount,
        getShippingFee,
        getTotalAmount,
        hasInvalidItems,
        hasUnlistedItems,
        cartToast,
        loading,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
