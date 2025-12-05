import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';        
import api from './services/api';
import LandingPage from '../src/pages/dashboard/LandingPage/LandingPage';
import Navigation from './components/shared/Navigation/Navigation';   
import Login from './pages/auth/Login/Login';
import Register from './pages/auth/Register/Register';
import ForgotPassword from './pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard/Dashboard';        
import AdminDashboard from './pages/dashboard/AdminDashboard/AdminDashboard';
import JobListings from './pages/jobs/JobListings/JobListings';       
import JobDetails from './pages/jobs/JobDetails/JobDetails';
import SavedJobs from './pages/jobs/SavedJobs/SavedJobs';
import JobManagement from './pages/jobs/JobManagement/JobManagement'; 
import Applications from './pages/applications/Applications/Applications';
import Profile from './pages/profile/Profile/Profile';
import RoleBasedRoute from './components/shared/RoleBasedRoute/RoleBasedRoute';
import Chatbot from './components/shared/Chatbot/Chatbot';
import './App.css';

const BackendStatus = () => {
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('🔍 Checking backend health...');

        // Use the shared Axios API client so the base URL (including /api)
        // always comes from environment variables in one place.
        const response = await api.get('/health');

        console.log('🏥 Backend health:', response.data);
        setBackendOnline(response.status === 200);
      } catch (error) {
        console.error('❌ Backend health check failed:', error);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!backendOnline) {
    return (
      <div className="backend-status error">
        <div className="status-content">
          <p>⚠️ Backend connection issue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backend-status success">
      <div className="status-content">
        <p>✅ Backend connected</p>
      </div>
    </div>
  );
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

const AuthDebug = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  React.useEffect(() => {
    console.log('🔍 AUTH DEBUG:', {
      user: user ? { 
        id: user._id, 
        email: user.email, 
        type: user.userType,
        profile: user.profile 
      } : null,
      isAuthenticated,
      loading,
      token: localStorage.getItem('authToken'),
      storedUser: localStorage.getItem('user')
    });
  }, [user, isAuthenticated, loading]);
  
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />        
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              
              {/* Protected Routes - Role Based */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* Admin Only Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Job Seeker Routes */}
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['jobseeker', 'admin']}>
                    <JobListings />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/jobs/:jobId" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['jobseeker', 'admin']}>
                    <JobDetails />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/saved-jobs" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['jobseeker', 'admin']}>
                    <SavedJobs />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Company Only Routes */}
              <Route path="/jobs/manage" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['company', 'admin']}>
                    <JobManagement />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Shared Routes (All authenticated users) */}
              <Route path="/applications" element={
                <ProtectedRoute>
                    <Applications />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
          <Chatbot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;