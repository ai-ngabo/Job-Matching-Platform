import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// Ensure /api is included in the baseURL
const FULL_API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

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
      authHeader: config.headers.Authorization?.substring(0, 30) + '...'
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
      dataKeys: Object.keys(response.data || {}),
      hasUser: !!response.data?.user,
      hasProfile: !!response.data?.user?.profile
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
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