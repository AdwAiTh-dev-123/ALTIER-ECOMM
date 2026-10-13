import React, { createContext, useContext, useState } from 'react';
import { initialOrders } from '../data/mockData';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([
    // Pre-populate with 1 item so the user can immediately test the Cart & Checkout flows
    {
      cartItemId: 'ci-1',
      productId: 'prod-1',
      title: 'Heavyweight Boxy Tee',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      variantId: 'v-102',
      color: 'Off-White',
      size: 'M',
      sku: 'HBT-WHT-M',
      price: 1290,
      quantity: 1
    }
  ]);

  const [orders, setOrders] = useState(initialOrders);
  const { reduceVariantStock } = useProducts();
  const { currentUser } = useAuth();

  const addToCart = (product, selectedVariant, quantity = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product._id && item.variantId === selectedVariant._id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const newItem = {
        cartItemId: `ci-${Date.now()}`,
        productId: product._id,
        title: product.title,
        image: product.images[0],
        variantId: selectedVariant._id,
        color: selectedVariant.color,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        quantity
      };
      return [...prev, newItem];
    });
  };

  const updateCartQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getTotalCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const placeOrder = (shippingAddress, paymentMethod = 'COD') => {
    if (cartItems.length === 0) {
      throw new Error('Your cart is empty');
    }

    // Deduct stock for all ordered variants
    cartItems.forEach(item => {
      reduceVariantStock(item.productId, item.variantId, item.quantity);
    });

    const subtotal = getSubtotal();
    const shippingFee = subtotal > 1500 ? 0 : 90; // Free shipping over 1500
    const totalAmount = subtotal + shippingFee;

    const newOrder = {
      _id: `ord-${Date.now()}`,
      orderNumber: `ORD-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
      user: {
        _id: currentUser?._id || 'guest',
        name: currentUser?.name || shippingAddress.fullName,
        email: currentUser?.email || 'guest@example.com'
      },
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => ({
        product: item.productId,
        title: item.title,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'Card' ? 'Paid' : 'Pending',
      orderStatus: 'Pending',
      subtotal,
      shippingFee,
      totalAmount
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(o => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
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
        orders,
        placeOrder,
        updateOrderStatus
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
