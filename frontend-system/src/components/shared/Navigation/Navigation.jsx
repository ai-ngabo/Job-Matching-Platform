import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Bookmark } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.userType === 'company') {
        fetchUnreadCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      } else if (user?.userType === 'jobseeker') {
        updateSavedCount();
        // Update saved count on storage change
        window.addEventListener('storage', updateSavedCount);
        return () => window.removeEventListener('storage', updateSavedCount);
      }
    }
  }, [isAuthenticated, user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/applications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.stats?.unviewedApplications || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const updateSavedCount = () => {
    const saved = JSON.parse(localStorage.getItem('savedJobs')) || [];
    setSavedCount(saved.length);
  };

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
          {user?.userType === 'jobseeker' && (
            <button 
              className="nav-item saved-jobs-btn"
              onClick={() => navigate('/saved-jobs')}
            >
              <Bookmark size={18} />
              Saved
              {savedCount > 0 && <span className="notification-badge">{savedCount}</span>}
            </button>
          )}
          {user?.userType === 'company' && (
            <button 
              className="nav-item notifications-btn"
              onClick={() => navigate('/applications')}
            >
              <Bell size={18} />
              Applications
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          )}
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