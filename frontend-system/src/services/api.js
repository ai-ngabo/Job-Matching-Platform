// services/api.js
import axios from 'axios';
import { getAPIBaseURL } from '../config/apiConfig';

const FULL_API_URL = getAPIBaseURL();

console.log('🔗 Connecting to backend at:', FULL_API_URL);

const api = axios.create({
  baseURL: FULL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') ?? sessionStorage.getItem('authToken');
    if (token) {
      console.log('📝 Token retrieved:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage or sessionStorage');
    }
    console.log('➡️ API Request:', config.method?.toUpperCase(), config.url, {
      hasToken: !!token,
      baseURL: config.baseURL,
      fullURL: config.url
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url, {
      dataKeys: Object.keys(response.data || {})
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      baseURL: error.config?.baseURL
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;