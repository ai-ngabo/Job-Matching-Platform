import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { healthCheck } from './services/healthCheck';
import LandingPage from '../src/pages/dashboard/LandingPage/LandingPage';
import Navigation from './components/shared/Navigation/Navigation';
import Login from './pages/auth/Login/Login';
import Register from './pages/auth/Register/Register';
import Dashboard from './pages/dashboard/Dashboard/Dashboard';
import JobListings from './pages/jobs/JobListings/JobListings';
import JobDetails from './pages/jobs/JobDetails/JobDetails';
import Profile from './pages/profile/Profile/Profile';
import './App.css';

const BackendStatus = () => {
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await healthCheck();
      setBackendOnline(isOnline);
    };
    
    checkBackend();
  }, []);

  if (backendOnline === null) return null;
  
  if (!backendOnline) {
    return (
      <div className="backend-error">
        <div className="error-content">
          <h2>🚨 Backend Server Offline</h2>
          <p>Please make sure your backend server is running on port 5000.</p>
          <p>Run this command in your backend folder:</p>
          <code>npm run dev</code>
        </div>
      </div>
    );
  }
  
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading JobIFY...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading JobIFY...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <BackendStatus />
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobListings /></ProtectedRoute>} />
              <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;