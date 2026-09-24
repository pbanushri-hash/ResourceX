import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Resource } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItemData {
  resource: Resource;
  quantity: number;
}

interface CartContextType {
  items: CartItemData[];
  loading: boolean;
  addItem: (resourceId: string, quantity?: number) => Promise<void>;
  updateQuantity: (resourceId: string, quantity: number) => Promise<void>;
  removeItem: (resourceId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const cart = await api.getCart();
      setItems(cart);
    } catch (err) {
      console.warn('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (resourceId: string, quantity = 1) => {
    try {
      const updated = await api.addToCart(resourceId, quantity);
      setItems(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const updateQuantity = async (resourceId: string, quantity: number) => {
    try {
      const updated = await api.updateCartItem(resourceId, quantity);
      setItems(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const removeItem = async (resourceId: string) => {
    try {
      const updated = await api.removeFromCart(resourceId);
      setItems(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setItems([]);
    } catch (err: any) {
      throw err;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.resource.sellingPrice), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        totalItems,
        totalPrice
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
