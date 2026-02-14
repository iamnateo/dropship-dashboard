import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = global.token;
    const savedUser = global.user;
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data;
    global.token = token;
    global.user = user;
    setUser(user);
    return user;
  };

  const register = async (email, password, fullName) => {
    const res = await authAPI.register({ email, password, fullName });
    const { user, token } = res.data;
    global.token = token;
    global.user = user;
    setUser(user);
    return user;
  };

  const logout = () => {
    global.token = null;
    global.user = null;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
