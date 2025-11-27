import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './JobSeekerDashboard.css';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalApplications: 0,
    aiMatchScore: 0,
    profileViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch application stats
      console.log('📊 Fetching application stats...');
      const statsResponse = await api.get('/applications/stats');
      const applicationStats = statsResponse.data.stats || {};
      console.log('✅ Stats fetched:', applicationStats);

      // Fetch recent jobs for recommendations
      console.log('🔍 Fetching recommended jobs...');
      const jobsResponse = await api.get('/jobs?limit=6&status=active');
      const jobs = jobsResponse.data.jobs || [];
      console.log('✅ Jobs fetched:', jobs.length);

      // Fetch saved jobs
      console.log('💾 Fetching saved jobs...');
      let saved = [];
      try {
        const savedResponse = await api.get('/users/saved-jobs');
        saved = savedResponse.data.savedJobs || [];
        console.log('✅ Saved jobs fetched:', saved.length);
      } catch (err) {
        console.warn('⚠️ Could not fetch saved jobs:', err.message);
      }

      // Calculate AI match score (simplified - can be enhanced with actual matching algorithm)
      const totalApps = applicationStats.totalApplications || 0;
      const acceptedApps = applicationStats.statusCounts?.accepted || 0;
      const matchScore = totalApps > 0 
        ? Math.round((acceptedApps / totalApps) * 100) 
        : 0;

      console.log('🎯 AI Match Score calculated:', matchScore);

      setStats({
        totalApplications: totalApps,
        aiMatchScore: matchScore,
        profileViews: applicationStats.profileViews || 0
      });

      setRecommendedJobs(jobs);
      setSavedJobs(saved);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jobseeker-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.profile?.firstName || 'User'}!</h1>
        <p>Your AI-powered job search starts here</p>
      </div>

      {error && (
        <div className="error-message" style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>AI Match Score</h3>
            <div className="stat-value">
              {loading ? '...' : `${stats.aiMatchScore}%`}
            </div>
            <p>Average job compatibility</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-content">
            <h3>Applications</h3>
            <div className="stat-value">
              {loading ? '...' : stats.totalApplications}
            </div>
            <p>Total applications sent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>Profile Views</h3>
            <div className="stat-value">
              {loading ? '...' : stats.profileViews}
            </div>
            <p>By employers</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/jobs')}
            >
              🔍 Browse Jobs
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/jobs')}
            >
              🤖 AI Recommendations
            </button>
            <button 
              className="action-btn tertiary"
              onClick={() => navigate('/profile')}
            >
              📝 Update Profile
            </button>
          </div>
        </div>

        <div className="recommendation-card">
          <h3>Recommended Jobs</h3>
          {loading ? (
            <div className="recommendation-placeholder">
              <p>Loading recommendations...</p>
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="recommendation-list">
              {recommendedJobs.map((job) => (
                <div 
                  key={job._id} 
                  className="recommendation-item"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <h4>{job.title}</h4>
                  <p>{job.companyName} • {job.location}</p>
                  <span className="job-type">{job.jobType}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="recommendation-placeholder">
              <p>Complete your profile for better matches</p>
              <small>Update your skills and experience to see personalized recommendations</small>
            </div>
          )}
        </div>

        <div className="saved-jobs-card">
          <h3>💾 Saved Jobs</h3>
          {savedJobs.length > 0 ? (
            <div className="saved-jobs-list">
              {savedJobs.slice(0, 3).map((job) => (
                <div 
                  key={job._id} 
                  className="saved-job-item"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <h4>{job.title}</h4>
                  <p>{job.companyName} • {job.location}</p>
                </div>
              ))}
              {savedJobs.length > 3 && (
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/jobs?saved=true')}
                >
                  View all {savedJobs.length} saved jobs →
                </button>
              )}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '14px' }}>No saved jobs yet. Start bookmarking jobs you're interested in!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;