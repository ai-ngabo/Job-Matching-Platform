// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 Initializing authentication...');
      
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();

      console.log('🔍 Auth state:', {
        hasUser: !!currentUser,
        hasToken: !!token,
        userType: currentUser?.userType
      });

      if (currentUser && token) {
        try {
          // Verify token is still valid
          const response = await authService.verifyToken();
          setUser(response.user);
          console.log('✅ Authentication successful');
        } catch (error) {
          console.error('❌ Authentication failed:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        // Clear any inconsistent state
        if ((!token && currentUser) || (!currentUser && token)) {
          console.warn('⚠️ Inconsistent auth state, clearing...');
          authService.logout();
        }
      }
      
      setLoading(false);
      setAuthChecked(true);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 Starting login process...');
      const data = await authService.login(credentials);
      setUser(data.user);
      
      console.log('✅ Login successful, user:', {
        id: data.user._id,
        email: data.user.email,
        userType: data.user.userType
      });
      
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!authService.getToken(),
    authChecked,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};