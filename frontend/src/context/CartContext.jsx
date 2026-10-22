import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  // Initialize cart state (keyed by logged-in user ID)
  const [cartItems, setCartItems] = useState([]);
  const [cartToast, setCartToast] = useState(null);

  // When user changes (login, logout, switch user), load only their private cart
  useEffect(() => {
    if (!userId) {
      setCartItems([]);
      return;
    }

    try {
      const saved = localStorage.getItem(`atelier_cart_${userId}`);
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error('Failed to load user cart:', e);
      setCartItems([]);
    }
  }, [userId]);

  // Persist only to the active user's private storage key
  useEffect(() => {
    if (!userId) return;

    try {
      localStorage.setItem(`atelier_cart_${userId}`, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cartItems, userId]);

  // Auto-clear toast notification
  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => setCartToast(null), 3500);
    return () => clearTimeout(timer);
  }, [cartToast]);

  /**
   * Add product variant to active user's cart with stock validation and max quantity checks
   */
  const addToCart = (product, selectedVariant, quantity = 1) => {
    if (!userId) {
      setCartToast({ type: 'error', message: 'Please sign in to add garments to your bag.' });
      return false;
    }

    const availableStock = selectedVariant?.stock || 0;

    // Rule 1: Prevent adding unavailable products
    if (availableStock <= 0) {
      setCartToast({ type: 'error', message: 'This variant is currently out of stock.' });
      return false;
    }

    let success = true;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.variantId === selectedVariant._id
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const targetQty = currentQty + quantity;

        // Rule 2: Stock validation
        if (targetQty > availableStock) {
          setCartToast({
            type: 'error',
            message: `Only ${availableStock} units available in stock.`,
          });
          success = false;
          return prev;
        }

        // Rule 3: Enforce max quantity limit (5 units per variant)
        if (targetQty > 5) {
          setCartToast({
            type: 'error',
            message: 'Maximum limit of 5 units per garment reached.',
          });
          success = false;
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: targetQty,
          stock: availableStock,
        };
        return updated;
      }

      // New item insertion with strict stock limits
      const safeQty = Math.min(quantity, availableStock, 5);
      const newItem = {
        cartItemId: `${product._id}-${selectedVariant._id}`,
        productId: product._id,
        title: product.name || product.title,
        slug: product.slug,
        image: selectedVariant.images?.[0] || product.images?.[0] || '',
        variantId: selectedVariant._id,
        color: selectedVariant.color,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
        price: Number(selectedVariant.price),
        stock: availableStock,
        quantity: safeQty,
      };

      return [...prev, newItem];
    });

    if (success) {
      setCartToast({
        type: 'success',
        message: `Added ${product.name || product.title} (${selectedVariant.color}, ${selectedVariant.size}) to your bag.`,
      });
    }

    return success;
  };

  /**
   * Update quantity with real-time stock validation
   */
  const updateCartQuantity = (cartItemId, newQty) => {
    if (!userId) return;

    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;

        if (newQty > item.stock) {
          setCartToast({
            type: 'error',
            message: `Cannot exceed available stock of ${item.stock} pieces.`,
          });
          return item;
        }

        if (newQty > 5) {
          setCartToast({
            type: 'error',
            message: 'Maximum 5 units allowed per garment.',
          });
          return item;
        }

        return { ...item, quantity: newQty };
      })
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
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

  // Check if any cart item exceeds stock or is invalid
  const hasInvalidItems = () => {
    return cartItems.some((item) => item.quantity > item.stock || item.stock <= 0);
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
        cartToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
