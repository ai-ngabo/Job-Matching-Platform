// services/authService.js
import api from './api';

export const authService = {
  async login(credentials) {
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      
      // Use '/api/auth/login' without the baseURL since it's already included
      const response = await api.post('/api/auth/login', credentials);
      
      console.log('✅ Login response:', response.data);
      
      if (response.data.token && response.data.user) {
        // Store as authToken to match api.js expectation
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Login successful - Token stored as authToken');
        console.log('👤 User type:', response.data.user.userType);
        
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
      console.log('📝 Attempting registration with:', { email: userData.email, userType: userData.userType });
      
      const response = await api.post('/api/auth/register', userData);
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Registration successful - Token stored as authToken');
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
    localStorage.removeItem('token'); // Remove old token if exists
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
      
      const response = await api.get('/api/auth/verify');
      return response.data;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      this.logout();
      throw error;
    }
  }
};