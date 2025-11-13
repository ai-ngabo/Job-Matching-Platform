import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <span className="brand-logo">JobIFY</span>
          <span className="brand-tagline">AI Jobs</span>
        </div>
        
        <div className="navbar-menu">
          <button 
            className="nav-item"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/jobs')}
          >
            Jobs
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/profile')}
          >
            Profile
          </button>
        </div>
        
        <div className="navbar-user">
          <span className="user-info">
            {user.userType === 'jobseeker' 
              ? `👤 ${user.profile?.firstName} ${user.profile?.lastName}`
              : `🏢 ${user.company?.name}`
            }
          </span>
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;