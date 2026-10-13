import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('atelier_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('atelier_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist]);

  // Clear feedback notification after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  const toggleWishlist = (product) => {
    if (!product || !product._id) return;

    if (isInWishlist(product._id)) {
      setWishlist(prev => prev.filter(item => item._id !== product._id));
      setFeedback({
        type: 'remove',
        message: `"${product.title}" removed from your saved items.`
      });
    } else {
      setWishlist(prev => [product, ...prev]);
      setFeedback({
        type: 'add',
        message: `"${product.title}" saved to your wishlist.`
      });
    }
  };

  const removeFromWishlist = (productId) => {
    const item = wishlist.find(p => p._id === productId);
    setWishlist(prev => prev.filter(p => p._id !== productId));
    if (item) {
      setFeedback({
        type: 'remove',
        message: `"${item.title}" removed from your saved items.`
      });
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    setFeedback({
      type: 'info',
      message: 'All saved items cleared.'
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
        feedback
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
