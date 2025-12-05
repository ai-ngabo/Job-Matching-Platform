// API configuration for production
export const getAPIBaseURL = () => {
  const baseURL = process.env.REACT_APP_API_URL || 'https://job-matching-platform-zvzw.onrender.com/api';
  console.log('🔗 API Base URL:', baseURL);
  return baseURL;
};
