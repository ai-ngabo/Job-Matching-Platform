import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './JobSeekerDashboard.css';

const JobManagement = () => {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to calculate profile completeness
  const calculateProfileCompleteness = (userProfile) => {
    if (!userProfile) return 0;

    const profile = userProfile.profile || {};
    const documents = profile.documents || {};

    let score = 0;
    let totalFields = 0;

    // Basic profile info (40%)
    if (profile.firstName) score += 10;
    if (profile.lastName) score += 10;
    if (profile.bio) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 10;
    totalFields += 4;

    // Experience and education (30%)
    if (profile.experience && profile.experience.length > 0) score += 15;  
    if (profile.education && profile.education.length > 0) score += 15;    
    totalFields += 2;

    // Documents (30%)
    if (documents.cv?.url) score += 15;
    if (documents.coverLetter?.url) score += 10;
    if (profile.profilePicture) score += 5;
    totalFields += 3;

    return Math.round((score / (totalFields * 10)) * 100);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel for better performance
      console.log('📊 Fetching dashboard data...');

      const [statsResponse, jobsResponse, profileResponse] = await Promise.all([
        api.get('/applications/stats'),
        api.get('/jobs?limit=6'),
        api.get('/users/profile')
      ]);

      const applicationStats = statsResponse.data.stats || {};
      const jobs = jobsResponse.data.jobs || [];
      const userData = profileResponse.data.user || profileResponse.data;  
      const userProfile = userData.profile || {};

      console.log('✅ Dashboard data fetched:', {
        applicationStats,
        jobsCount: jobs.length,
        userProfile: userProfile
      });

      // Calculate AI match score based on profile completeness and job compatibility
      const totalApps = applicationStats.totalApplications || 0;

      // Calculate profile completeness score (0-100)
      const profileCompleteness = calculateProfileCompleteness(userData);  

      // Calculate application success rate (if any applications)
      const successRate = totalApps > 0
        ? Math.round(((applicationStats.statusCounts?.accepted || 0) / totalApps) * 50)
        : 0;

      // Combine scores for AI match score (60% profile completeness, 40% success rate)
      const matchScore = Math.round((profileCompleteness * 0.6) + (successRate * 0.4));

      // Ensure minimum score of 10% for users with some profile data      
      const finalMatchScore = Math.max(matchScore, profileCompleteness > 0 ? 10 : 0);

      console.log('🎯 AI Match Score breakdown:', {
        profileCompleteness,
        successRate,
        finalScore: finalMatchScore
      });

      setStats({
        totalApplications: totalApps,
        aiMatchScore: finalMatchScore,
        profileViews: userProfile.views || 0
      });

      setRecommendedJobs(jobs);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getMatchScoreMessage = (score) => {
    if (score >= 80) return 'Excellent match rate!';
    if (score >= 60) return 'Good compatibility';
    if (score >= 40) return 'Average matching';
    return 'Complete your profile to improve';
  };

  return (
    <div className="jobseeker-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.profile?.firstName || 'User'}!</h1>       
        <p>Your AI-powered job search starts here</p>
      </div>

      {error && (
        <div className="error-message" style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>AI Match Score</h3>
            <div
              className="stat-value"
              style={{ color: getMatchScoreColor(stats.aiMatchScore) }}    
            >
              {loading ? '...' : `${stats.aiMatchScore}%`}
            </div>
            <p>{loading ? 'Calculating...' : getMatchScoreMessage(stats.aiMatchScore)}</p>
            {!loading && stats.aiMatchScore < 60 && (
              <button
                className="improve-btn"
                onClick={() => navigate('/profile')}
              >
                Improve Score
              </button>
            )}
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
            {!loading && stats.totalApplications === 0 && (
              <button
                className="action-link"
                onClick={() => navigate('/jobs')}
              >
                Start Applying
              </button>
            )}
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
            {!loading && stats.profileViews === 0 && (
              <button
                className="action-link"
                onClick={() => navigate('/profile')}
              >
                Boost Visibility
              </button>
            )}
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
              onClick={() => navigate('/applications')}
            >
              📋 My Applications
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
          <div className="card-header">
            <h3>🤖 Recommended Jobs</h3>
            <button
              className="view-all-btn"
              onClick={() => navigate('/jobs')}
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="recommendation-placeholder">
              <div className="loading-spinner-small"></div>
              <p>Finding your perfect matches...</p>
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="recommendation-list">
              {recommendedJobs.map((job) => (
                <div
                  key={job._id}
                  className="recommendation-item"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className="job-type">{job.jobType}</span>        
                  </div>
                  <p className="company-info">{job.companyName} • {job.location}</p>
                  <div className="job-meta">
                    <span className="salary">
                      {job.salaryRange?.min ? `$${job.salaryRange.min} - $${job.salaryRange.max}` : 'Competitive'}
                    </span>
                    <span className="applicants">
                      {job.applicationCount || 0} applicants
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="recommendation-placeholder">
              <p>Complete your profile for better matches</p>
              <small>Update your skills, experience, and preferences to see personalized recommendations</small>
              <button
                className="btn-primary"
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>

        <div className="saved-jobs-card">
          <div className="card-header">
            <h3>📌 Saved Jobs</h3>
            <button
              className="view-all-btn"
              onClick={() => navigate('/saved-jobs')}
            >
              View All →
            </button>
          </div>
          <p className="card-subtitle">Your collection of jobs you're interested in</p>
          <div className="saved-jobs-preview">
            <p className="info-text">Save jobs to apply later or compare opportunities</p>
            <button
              className="browse-saved-btn"
              onClick={() => navigate('/saved-jobs')}
            >
              View Saved Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Profile completeness prompt */}
      {!loading && stats.aiMatchScore < 70 && (
        <div className="improvement-banner">
          <div className="banner-content">
            <h4>🚀 Boost Your AI Match Score!</h4>
            <p>Complete your profile to get better job recommendations and increase your chances</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/profile')}
            >
              Improve Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;  