import React, { createContext, useContext, useState } from 'react';
import { initialProducts, initialCategories } from '../data/mockData';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);

  const getProductById = (id) => {
    return products.find(p => p._id === id);
  };

  const getProductBySlug = (slug) => {
    return products.find(p => p.slug === slug);
  };

  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      _id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(prev =>
      prev.map(p => (p._id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  const addCategory = (categoryData) => {
    const newCategory = {
      ...categoryData,
      _id: `cat-${Date.now()}`
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  const reduceVariantStock = (productId, variantId, quantity) => {
    setProducts(prev =>
      prev.map(p => {
        if (p._id !== productId) return p;
        const updatedVariants = p.variants.map(v => {
          if (v._id === variantId) {
            const nextStock = Math.max(0, v.stock - quantity);
            return { ...v, stock: nextStock };
          }
          return v;
        });
        return { ...p, variants: updatedVariants };
      })
    );
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        getProductById,
        getProductBySlug,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        reduceVariantStock
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
