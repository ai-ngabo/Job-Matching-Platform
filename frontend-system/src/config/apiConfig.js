// API configuration for production
export const getAPIBaseURL = () => {
  // For production (Vercel)
  if (typeof window !== 'undefined' && window.location.hostname === 'jobify-rw.vercel.app') {
    return 'https://job-matching-platform-zvzw.onrender.com/api';
  }
  
  // For development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  
  // Fallback to environment variable
  const envURL = import.meta.env.VITE_API_BASE_URL;
  return envURL ? `${envURL}/api` : 'http://localhost:5000/api';
};
