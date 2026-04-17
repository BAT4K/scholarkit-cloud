/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const processToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
      localStorage.setItem("token", token);
      return decoded;
    } catch {
      logout();
      return null;
    }
  };

  // 1. Check for token on app mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      processToken(token);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Login Action
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const decodedUser = processToken(res.data.token);
    setUser({ ...decodedUser, ...res.data.user });
    return res.data.user;
  };

  // 3. Register Action (NEW)
  const register = async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    const decodedUser = processToken(res.data.token);
    setUser({ ...decodedUser, ...res.data.user });
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage in components
export const useAuth = () => useContext(AuthContext);
