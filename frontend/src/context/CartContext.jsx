/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // Helper to get headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Function to fetch the latest count from backend
  const refreshCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axios.get('/api/cart', getAuthHeaders());
      const totalItems = res.data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    } catch (err) {
      console.error("Failed to update cart count", err);
    }
  };

  // Auto-fetch when user logs in
  useEffect(() => {
    refreshCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
