import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('kite_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('kite_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('kite_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('kite_token', data.token);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      // Decode the Google JWT token to get user info
      const decoded = jwtDecode(googleToken);
      
      const googleData = {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };

      // Send to backend to create or find user
      const { data } = await authAPI.loginWithGoogle(googleData);
      localStorage.setItem('kite_token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Google authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('kite_token');
    setUser(null);
  };

  const updateBalance = (newBalance) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
