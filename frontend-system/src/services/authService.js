// services/authService.js
import api from './api';

export const authService = {
  async login(credentials) {
    try {
      console.log('🔐 Attempting login...');
      
      // Use full path including /api
      const response = await api.post('/auth/login', credentials);
      
      console.log('✅ Login response received');
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Login successful - User type:', response.data.user.userType);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    console.log('✅ Logout - Tokens cleared');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  },

  // Verify token is still valid
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      // Token exists and was already decoded by auth middleware on init
      // Just return a basic verification response
      const user = this.getCurrentUser();
      return { user };
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      this.logout();
      throw error;
    }
  }
};

export default authService;