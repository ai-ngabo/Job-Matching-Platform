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
    profileCompletion: 0,
    skillsScore: 0,
    educationScore: 0,
    experienceScore: 0
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch application stats, AI-powered recommended jobs, and recent applications in parallel
      console.log('📊 Fetching application stats, AI recommendations, and recent applications...');
      const [statsResponse, recommendedResponse, recentAppsResponse] = await Promise.all([
        api.get('/applications/stats'),
        api.get('/jobs/recommended?limit=6'),
        api.get('/applications/recent?limit=5')
      ]);

      const applicationStats = statsResponse.data.stats || {};
      console.log('✅ Application stats fetched:', applicationStats);

      const recommendedData = recommendedResponse.data || {};
      const aiRecommendedJobs = Array.isArray(recommendedData.data) ? recommendedData.data : [];
      console.log('✅ AI recommended jobs fetched:', aiRecommendedJobs.length, aiRecommendedJobs);

      const recentApps = recentAppsResponse.data?.applications || [];
      console.log('✅ Recent applications fetched:', recentApps.length);

      // Calculate AI match score:
      // 1) Prefer average matchScore from AI recommended jobs (backend /jobs/recommended)
      // 2) Fallback to simple ratio of accepted applications if no AI data is available
      const totalApps = applicationStats.totalApplications || 0;
      const acceptedApps = applicationStats.statusCounts?.accepted || 0;

      let aiMatchScore = 0;
      if (aiRecommendedJobs.length > 0) {
        const validMatches = aiRecommendedJobs
          .map(job => typeof job.matchScore === 'number' ? job.matchScore : 0)
          .filter(score => score >= 40);

        if (validMatches.length > 0) {
          const totalMatch = validMatches.reduce((sum, score) => sum + score, 0);
          aiMatchScore = Math.round(totalMatch / validMatches.length);
        } else if (totalApps > 0) {
          aiMatchScore = Math.round((acceptedApps / totalApps) * 100);
        } else {
          aiMatchScore = 0;
        }
      } else if (totalApps > 0) {
        aiMatchScore = Math.round((acceptedApps / totalApps) * 100);
      }

      console.log('🎯 AI Match Score (from AI recommendations / applications):', aiMatchScore);

      // Compute profile-based scores (deterministic per user)
      const profile = user?.profile || {};
      const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
      const hasCv = !!profile.documents?.cv?.url;

      const skillsScore = Math.min(100, skillsCount * 20); // each skill worth 20%, max 100

      const educationLevel = profile.educationLevel || 'high-school';
      const educationScoreMap = {
        'high-school': 40,
        'diploma': 60,
        'bachelors': 80,
        'masters': 90,
        'phd': 100
      };
      const educationScore = educationScoreMap[educationLevel] ?? 40;

      const experienceLevel = profile.experienceLevel || 'entry';
      const experienceScoreMap = {
        'entry': 40,
        'mid': 70,
        'senior': 90,
        'executive': 100
      };
      const experienceScore = experienceScoreMap[experienceLevel] ?? 40;

      // Profile completion based on key fields
      const completionParts = [
        !!profile.firstName,
        !!profile.lastName,
        !!profile.location,
        !!profile.bio,
        skillsCount > 0,
        hasCv
      ];
      const filledCount = completionParts.filter(Boolean).length;
      const profileCompletion = Math.round((filledCount / completionParts.length) * 100);

      setStats({
        totalApplications: totalApps,
        aiMatchScore,
        profileCompletion,
        skillsScore,
        educationScore,
        experienceScore
      });

      setRecommendedJobs(aiRecommendedJobs);
      setRecentApplications(recentApps);

      // Build simple AI-style feedback text (no fake data, using computed scores)
      const strengths = [];
      const improvements = [];

      if (skillsScore >= 70) strengths.push('your technical skills');
      else improvements.push('adding more relevant skills to your profile');

      if (educationScore >= 80) strengths.push('your education background');
      else improvements.push('updating your education details');

      if (experienceScore >= 70) strengths.push('your level of experience');
      else improvements.push('highlighting more of your experience');

      const strengthsText = strengths.length
        ? `You are strong in ${strengths.join(' and ')}.`
        : 'Your profile is a good starting point.';

      const improvementsText = improvements.length
        ? `To attract more companies, consider ${improvements.join(', ')}.`
        : 'Your profile already looks very complete – keep applying to relevant roles.';

      setFeedback(`${strengthsText} ${improvementsText}`);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
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
            <h3>Overall AI Match</h3>
            <div className="stat-value">
              {loading ? '...' : `${stats.aiMatchScore}%`}
            </div>
            <p>How well your profile matches current jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧩</div>
          <div className="stat-content">
            <h3>Profile Completion</h3>
            <div className="stat-value">
              {loading ? '...' : `${stats.profileCompletion}%`}
            </div>
            <p>Profile strength for better AI matches</p>
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
      </div>

      {/* AI Feedback Summary */}
      {!loading && feedback && (
        <div className="ai-feedback-card">
          <h3>AI Profile Insights</h3>
          <p>{feedback}</p>
        </div>
      )}

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
          <h3>AI Recommended Jobs</h3>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="job-type">{job.jobType}</span>
                    {typeof job.matchScore === 'number' && (
                      <span className="ai-match-badge">
                        AI Match: {job.matchScore}%
                      </span>
                    )}
                  </div>
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
          <div className="card-header">
            <h3>📝 Recent Applications</h3>
            <button
              className="view-all-btn"
              onClick={() => navigate('/applications')}
            >
              View All →
            </button>
          </div>
          <p className="card-subtitle">Track your latest applications and statuses</p>
          {loading ? (
            <div className="saved-jobs-preview">
              <p className="info-text">Loading recent applications...</p>
            </div>
          ) : recentApplications.length > 0 ? (
            <div className="saved-jobs-list">
              {recentApplications.map((app) => (
                <div
                  key={app._id}
                  className="saved-job-item"
                  onClick={() => navigate('/applications')}
                >
                  <h4>{app.jobId?.title}</h4>
                  <p>
                    {app.jobId?.companyName} • {app.jobId?.location} •{' '}
                    <span className={`status-pill status-${app.status}`}>
                      {app.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="saved-jobs-preview">
              <p className="info-text">You haven't applied to any jobs yet.</p>
              <button
                className="browse-saved-btn"
                onClick={() => navigate('/jobs')}
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;