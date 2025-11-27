import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  console.log('🔐 RoleBasedRoute check:', {
    user: user ? { type: user.userType, email: user.email } : null,
    allowedRoles,
    loading
  });
  
  if (loading) {
    return <div className="loading-screen">Checking permissions...</div>;
  }
  
  // If no user or user type not in allowed roles, redirect to dashboard
  if (!user || !allowedRoles.includes(user.userType)) {
    console.warn(`🚫 Access denied. User type: ${user?.userType}, Allowed: ${allowedRoles.join(', ')}`);
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('✅ Access granted to RoleBasedRoute');
  return children;
};

export default RoleBasedRoute;