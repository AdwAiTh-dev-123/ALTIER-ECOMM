import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getWishlistApi,
  toggleWishlistApi,
  clearWishlistApi,
} from '../api/shopApi';


const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  const [wishlist, setWishlist] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch authenticated user's wishlist from MongoDB
   */
  const fetchWishlist = useCallback(async () => {
    if (!userId || user?.role === "admin") {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await getWishlistApi();
      const items = res.data?.data || [];
      // Ensure only valid active products are in the list
      setWishlist(items.filter((item) => item && (item._id || typeof item === 'string')));
    } catch (err) {
      console.error('Failed to load user wishlist from database:', err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load database wishlist whenever authenticated user changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Clear feedback notification after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  /**
   * Check if a product ID exists in the active wishlist
   */
  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some((item) => {
      const id = typeof item === 'object' && item !== null ? item._id : item;
      return String(id) === String(productId);
    });
  };

  /**
   * Toggle product in MongoDB wishlist
   */
  const toggleWishlist = async (product) => {
    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'Please sign in to save garments to your wishlist.',
      });
      return false;
    }

    if (user?.role === "admin") {
      setFeedback({
        type: "error",
        message: "Administrators cannot save garments to wishlist.",
      });
      return false;
    }

    const prodId = product?._id || product;
    if (!prodId) return false;

    const title = product?.name || product?.title || 'Garment';
    const isCurrentlySaved = isInWishlist(prodId);

    // Optimistic UI update
    if (isCurrentlySaved) {
      setWishlist((prev) => prev.filter((p) => String(p._id || p) !== String(prodId)));
      setFeedback({
        type: 'remove',
        message: `"${title}" removed from your saved items.`,
      });
    } else {
      setWishlist((prev) => [product, ...prev]);
      setFeedback({
        type: 'add',
        message: `"${title}" saved to your wishlist.`,
      });
    }

    try {
      const res = await toggleWishlistApi(prodId);
      const serverSaved = res.data?.isWishlisted;

      // Re-fetch or sync state with database response
      if (serverSaved !== undefined) {
        if (serverSaved && !isCurrentlySaved) {
          // Confirmed added
        } else if (!serverSaved && isCurrentlySaved) {
          // Confirmed removed
        }
      }
      return serverSaved ?? !isCurrentlySaved;
    } catch (err) {
      console.error('Failed to update wishlist in database:', err);
      // Rollback on server error
      fetchWishlist();
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not update wishlist.',
      });
      return isCurrentlySaved;
    }
  };

  /**
   * Explicitly remove product from MongoDB wishlist
   */
  const removeFromWishlist = async (productId) => {
    if (!userId || !productId) return;

    const item = wishlist.find((p) => String(p._id || p) === String(productId));
    const title = item?.name || item?.title || 'Garment';

    // Optimistic removal
    setWishlist((prev) => prev.filter((p) => String(p._id || p) !== String(productId)));
    setFeedback({
      type: 'remove',
      message: `"${title}" removed from your saved items.`,
    });

    try {
      await toggleWishlistApi(productId);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      fetchWishlist();
    }
  };

  /**
   * Clear entire wishlist
   */
  const clearWishlist = async () => {
    if (!userId) return;
    try {
      await clearWishlistApi();
      setWishlist([]);
      setFeedback({
        type: 'info',
        message: 'All saved items cleared.',
      });
    } catch (err) {
      console.error('Failed to clear wishlist:', err);
    }
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
        loading,
        fetchWishlist,
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

