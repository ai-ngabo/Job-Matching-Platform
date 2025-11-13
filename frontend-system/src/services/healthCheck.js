import api from './api';

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Backend health check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
};