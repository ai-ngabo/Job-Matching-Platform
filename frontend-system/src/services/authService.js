// services/authService.js
import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data.token && response.data.user) {
      // Store as authToken to match api.js expectation
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('✅ Login successful - Token stored as authToken');
    }
    
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    
    if (response.data.token && response.data.user) {
      // Store as authToken to match api.js expectation
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('✅ Registration successful - Token stored as authToken');
    }
    
    return response.data;
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
  }
};