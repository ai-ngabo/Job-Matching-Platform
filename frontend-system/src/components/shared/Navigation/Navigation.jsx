import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Briefcase, Menu, X, LogOut } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/applications/stats`, {
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
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <span className="brand-logo">JobIFY</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          <button 
            className="nav-item"
            onClick={() => handleNavigation('/dashboard')}
          >
            Dashboard
          </button>
          
          {user?.userType === 'jobseeker' ? (
            <>
              <button 
                className="nav-item"
                onClick={() => handleNavigation('/jobs')}
              >
                Jobs
              </button>
              <button 
                className="nav-item saved-jobs-btn"
                onClick={() => handleNavigation('/saved-jobs')}
              >
                <Bookmark size={18} />
                Saved
                {savedCount > 0 && <span className="notification-badge">{savedCount}</span>}
              </button>
              <button 
                className="nav-item applications-btn"
                onClick={() => handleNavigation('/applications')}
              >
                <Briefcase size={18} />
                Applications
              </button>
            </>
          ) : user?.userType === 'company' ? (
            <>
              <button 
                className="nav-item"
                onClick={() => handleNavigation('/jobs/manage')}
              >
                <Briefcase size={18} />
                Manage Jobs
              </button>
              <button 
                className="nav-item notifications-btn"
                onClick={() => handleNavigation('/applications')}
              >
                <Bell size={18} />
                Applications
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
            </>
          ) : null}
          
          <button 
            className="nav-item"
            onClick={() => handleNavigation('/profile')}
          >
            Profile
          </button>
        </div>
        
        <div className="navbar-user desktop-user">
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

        {/* Hamburger Menu Button */}
        <button 
          className="hamburger-menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Sidebar */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button 
                className="close-btn"
                onClick={closeMobileMenu}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mobile-menu-user-info">
              <div className="user-initials">
                {user.userType === 'jobseeker' 
                  ? `${user.profile?.firstName?.charAt(0) || 'J'}${user.profile?.lastName?.charAt(0) || 'S'}`
                  : `${user.company?.name?.charAt(0) || 'C'}`
                }
              </div>
              <div>
                <p className="user-name">
                  {user.userType === 'jobseeker' 
                    ? `${user.profile?.firstName} ${user.profile?.lastName}`
                    : user.company?.name
                  }
                </p>
                <p className="user-role">{user.userType === 'jobseeker' ? 'Job Seeker' : 'Company'}</p>
              </div>
            </div>

            <div className="mobile-menu-items">
              <button 
                className="mobile-nav-item"
                onClick={() => handleNavigation('/dashboard')}
              >
                Dashboard
              </button>
              
              {user?.userType === 'jobseeker' ? (
                <>
                  <button 
                    className="mobile-nav-item"
                    onClick={() => handleNavigation('/jobs')}
                  >
                    Jobs
                  </button>
                  <button 
                    className="mobile-nav-item"
                    onClick={() => handleNavigation('/saved-jobs')}
                  >
                    <Bookmark size={18} />
                    Saved Jobs
                    {savedCount > 0 && <span className="notification-badge">{savedCount}</span>}
                  </button>
                  <button 
                    className="mobile-nav-item"
                    onClick={() => handleNavigation('/applications')}
                  >
                    <Briefcase size={18} />
                    Applications
                  </button>
                </>
              ) : user?.userType === 'company' ? (
                <>
                  <button 
                    className="mobile-nav-item"
                    onClick={() => handleNavigation('/jobs/manage')}
                  >
                    <Briefcase size={18} />
                    Manage Jobs
                  </button>
                  <button 
                    className="mobile-nav-item"
                    onClick={() => handleNavigation('/applications')}
                  >
                    <Bell size={18} />
                    Applications
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </button>
                </>
              ) : null}
              
              <button 
                className="mobile-nav-item"
                onClick={() => handleNavigation('/profile')}
              >
                Profile
              </button>
            </div>

            <div className="mobile-menu-footer">
              <button 
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;