import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import './JobSeekerDashboard.css';

const JobSeekerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="jobseeker-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.profile?.firstName}!
</h1>
        <p>Your AI-powered job search starts here</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>AI Match Score</h3>
            <div className="stat-value">--%</div>
            <p>Average job compatibility</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-content">
            <h3>Applications</h3>
            <div className="stat-value">0</div>
            <p>Total applications sent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>Profile Views</h3>
            <div className="stat-value">0</div>
            <p>By employers</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary">
              🔍 Browse Jobs
            </button>
            <button className="action-btn secondary">
              🤖 AI Recommendations
            </button>
            <button className="action-btn tertiary">
              📝 Update Profile
            </button>
          </div>
        </div>

        <div className="recommendation-card">
          <h3>AI Job Matches</h3>
          <div className="recommendation-placeholder">
            <p>AI recommendations will appear here</p>
            <small>Complete your profile for better matches</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;