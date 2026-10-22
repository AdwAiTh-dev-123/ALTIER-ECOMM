import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  // Initialize wishlist state (keyed by logged-in user ID)
  const [wishlist, setWishlist] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // When user changes (login, logout, switch accounts), load only their private wishlist
  useEffect(() => {
    if (!userId) {
      setWishlist([]);
      return;
    }

    try {
      const saved = localStorage.getItem(`atelier_wishlist_${userId}`);
      setWishlist(saved ? JSON.parse(saved) : []);
    } catch {
      setWishlist([]);
    }
  }, [userId]);

  // Persist only to active user's private key
  useEffect(() => {
    if (!userId) return;

    try {
      localStorage.setItem(`atelier_wishlist_${userId}`, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist, userId]);

  // Clear feedback notification after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  const toggleWishlist = (product) => {
    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'Please sign in to save garments to your wishlist.',
      });
      return false;
    }

    if (!product || !product._id) return false;

    const title = product.name || product.title || 'Garment';

    if (isInWishlist(product._id)) {
      setWishlist((prev) => prev.filter((item) => item._id !== product._id));
      setFeedback({
        type: 'remove',
        message: `"${title}" removed from your saved items.`,
      });
      return false;
    } else {
      setWishlist((prev) => [product, ...prev]);
      setFeedback({
        type: 'add',
        message: `"${title}" saved to your wishlist.`,
      });
      return true;
    }
  };

  const removeFromWishlist = (productId) => {
    const item = wishlist.find((p) => p._id === productId);
    setWishlist((prev) => prev.filter((p) => p._id !== productId));
    if (item) {
      setFeedback({
        type: 'remove',
        message: `"${item.name || item.title}" removed from your saved items.`,
      });
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    setFeedback({
      type: 'info',
      message: 'All saved items cleared.',
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        feedback,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
