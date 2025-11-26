import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    
    // Store token and user data if provided by backend
    if (response.data.token) {
      console.log('💾 Storing token from register:', response.data.token.substring(0, 20) + '...');
      localStorage.setItem('authToken', response.data.token);
    } else {
      console.error('❌ No token in register response:', response.data);
    }
    if (response.data.user) {
      console.log('💾 Storing user from register:', response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async login(credentials) {
    const { rememberMe, ...loginPayload } = credentials;
    const response = await api.post('/auth/login', loginPayload);

    const storage = rememberMe ? localStorage : sessionStorage;
    const fallbackStorage = rememberMe ? sessionStorage : localStorage;

    // Clean out the storage type we are not using to avoid stale sessions
    fallbackStorage.removeItem('authToken');
    fallbackStorage.removeItem('user');

    // Store token and user data if provided by backend
    if (response.data.token) {
      console.log('💾 Storing token:', response.data.token.substring(0, 20) + '...');
      storage.setItem('authToken', response.data.token);
    } else {
      console.error('❌ No token in login response:', response.data);
    }
    if (response.data.user) {
      console.log('💾 Storing user:', response.data.user);
      storage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  },

  getCurrentUser() {
    const storedUser =
      localStorage.getItem('user') ?? sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  },

  getToken() {
    return (
      localStorage.getItem('authToken') ?? sessionStorage.getItem('authToken')
    );
  },

  isAuthenticated() {
    return (
      !!localStorage.getItem('authToken') ||
      !!sessionStorage.getItem('authToken')
    );
  },

  async requestPasswordReset(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(payload) {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  }
};