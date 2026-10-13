import React, { createContext, useContext, useState } from 'react';
import { initialBanners } from '../data/mockData';

const BannerContext = createContext();

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState(initialBanners);

  const addBanner = (newBanner) => {
    const banner = {
      ...newBanner,
      _id: `banner-${Date.now()}`,
      isActive: true,
      order: banners.length + 1
    };
    setBanners(prev => [banner, ...prev]);
    return banner;
  };

  const updateBanner = (id, updatedFields) => {
    setBanners(prev =>
      prev.map(b => (b._id === id ? { ...b, ...updatedFields } : b))
    );
  };

  const deleteBanner = (id) => {
    setBanners(prev => prev.filter(b => b._id !== id));
  };

  const toggleBannerStatus = (id) => {
    setBanners(prev =>
      prev.map(b => (b._id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  return (
    <BannerContext.Provider
      value={{
        banners,
        activeBanners: banners.filter(b => b.isActive),
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerStatus
      }}
    >
      {children}
    </BannerContext.Provider>
  );
};

export const useBanners = () => useContext(BannerContext);
