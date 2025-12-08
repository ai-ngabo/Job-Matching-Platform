import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  TrendingUp,
  Eye,
  Calendar,
  ArrowRight,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  PlusCircle
} from 'lucide-react';
import api from '../../../services/api';  
import JobPostForm from '../../../components/jobs/JobPostForm'; // Import the same JobPostForm
import './CompanyDashboard.css';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    profileViews: 0
  });

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel
      const [jobsResponse, applicationsResponse] = await Promise.all([
        api.get('/jobs/company/my-jobs'),
        api.get('/applications/company/received?limit=5')
      ]);

      const companyJobs = jobsResponse.data.jobs || [];
      const companyApplications = applicationsResponse.data.applications || [];

      // Calculate stats
      const activeJobs = companyJobs.filter(j => j.status === 'active' || j.status === 'published').length;
      const totalViews = companyJobs.reduce((sum, job) => sum + (job.views || 0), 0);
      const totalApplications = companyJobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0);
      
      // Calculate new applications (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newApplications = companyApplications.filter(app => {
        const appliedDate = new Date(app.appliedAt || app.createdAt);
        return appliedDate > oneWeekAgo;
      }).length;

      setJobs(companyJobs);
      setApplications(companyApplications);
      setStats({
        totalJobs: companyJobs.length,
        activeJobs,
        totalApplications,
        newApplications,
        profileViews: totalViews
      });
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Simple page refresh
    window.location.reload();
  };

  const handlePostNewJob = () => {
    // Show the same JobPostForm that appears in JobManagement
    setShowJobForm(true);
  };

  const handleJobFormSuccess = () => {
    setShowJobForm(false);
    // Refresh dashboard data after successful job post
    fetchDashboardData();
  };

  const handleJobFormCancel = () => {
    setShowJobForm(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || 'U'}${lastName?.charAt(0) || 'S'}`.toUpperCase();
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    const apiBase = typeof window !== 'undefined' 
      ? (window.__ENV__?.VITE_API_BASE_URL || 'http://localhost:5000')
      : 'http://localhost:5000';
    return `${apiBase}${profilePicture}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'new';
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return 'new';
      case 'reviewing':
        return 'reviewing';
      case 'interview':
        return 'interview';
      case 'shortlisted':
        return 'shortlisted';
      case 'accepted':
      case 'hired':
        return 'accepted';
      case 'rejected':
        return 'rejected';
      default:
        return 'new';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return <Clock size={12} />;
      case 'reviewing':
        return <FileText size={12} />;
      case 'interview':
        return <Calendar size={12} />;
      case 'shortlisted':
        return <CheckCircle size={12} />;
      case 'accepted':
      case 'hired':
        return <CheckCircle size={12} />;
      case 'rejected':
        return <XCircle size={12} />;
      default:
        return <FileText size={12} />;
    }
  };

  if (loading) {
    return (
      <div className="company-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const topJobs = jobs
    .filter(j => j.status === 'active' || j.status === 'published')
    .sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0))
    .slice(0, 3);

  const engagementRate = stats.totalJobs > 0
    ? Math.round((stats.totalApplications / (stats.profileViews || 1)) * 100)
    : 0;

  return (
    <div className="company-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.company?.name || user?.email?.split('@')[0] || 'Company'}!</h1>
          <p>Manage your recruitment and connect with top talent</p>
        </div>
        {/* REMOVED: header-actions div with Post New Job and Refresh buttons */}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <div>
            <strong>Note:</strong> {error}
            <button className="retry-link" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div 
          className="stat-card" 
          onClick={() => navigate('/jobs/manage')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon briefcase"><Briefcase size={24} /></div>
          <div className="stat-content">
            <h3>Active Job Postings</h3>
            <div className="stat-value">{stats.activeJobs}</div>
            <p className="stat-subtext">{stats.totalJobs} total posted</p>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate('/applications')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon applications"><Users size={24} /></div>
          <div className="stat-content">
            <h3>Applications</h3>
            <div className="stat-value">{stats.totalApplications}</div>
            <p className="stat-subtext highlight">{stats.newApplications} new this week</p>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon views"><Eye size={24} /></div>
          <div className="stat-content">
            <h3>Profile Views</h3>
            <div className="stat-value">{stats.profileViews}</div>
            <p className="stat-subtext">By job seekers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon messages"><TrendingUp size={24} /></div>
          <div className="stat-content">
            <h3>Engagement Rate</h3>
            <div className="stat-value">{engagementRate}%</div>
            <p className="stat-subtext">Last 30 days</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Applications</h2>
            {applications.length > 0 && (
              <button 
                className="view-all" 
                onClick={() => navigate('/applications')}
              >
                View All <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="applications-list">
            {applications.length > 0 ? (
              applications.slice(0, 3).map((application) => (
                <div 
                  key={application._id} 
                  className="application-item"
                  onClick={() => navigate(`/applications/${application._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="app-avatar">
                    {getProfilePictureUrl(application.applicant?.profile?.profilePicture) ? (
                      <img 
                        src={getProfilePictureUrl(application.applicant.profile.profilePicture)}
                        alt={`${application.applicant?.profile?.firstName} ${application.applicant?.profile?.lastName}`}
                        className="app-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = 
                            `<div class="avatar-initials">${getInitials(
                              application.applicant?.profile?.firstName,
                              application.applicant?.profile?.lastName
                            )}</div>`;
                        }}
                      />
                    ) : (
                      <div className="avatar-initials">
                        {getInitials(application.applicant?.profile?.firstName, application.applicant?.profile?.lastName)}
                      </div>
                    )}
                  </div>
                  <div className="app-info">
                    <h4>{application.applicant?.profile?.firstName || 'Unknown'} {application.applicant?.profile?.lastName || 'User'}</h4>
                    <p>{application.jobTitle || application.job?.title || 'Position'}</p>
                    <span className="app-date">
                      <Calendar size={12} /> {formatDate(application.appliedAt || application.createdAt)}
                    </span>
                    {application.applicant?.profile?.documents?.cv?.url && (
                      <a 
                        href={application.applicant.profile.documents.cv.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="cv-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} /> View CV
                      </a>
                    )}
                  </div>
                  <div className="app-status">
                    <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status || 'new'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-applications">
                <AlertCircle size={24} />
                <p>No applications received yet</p>
                <small>Applications will appear here when job seekers apply to your positions</small>
                <button 
                  className="btn btn-outline"
                  onClick={handlePostNewJob}
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Open Positions</h2>
            {topJobs.length > 0 && (
              <button 
                className="view-all" 
                onClick={() => navigate('/jobs/manage')}
              >
                View All <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="jobs-list">
            {topJobs.length > 0 ? (
              topJobs.map((job) => (
                <div 
                  key={job._id} 
                  className="job-item"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    {job.matchScore && (
                      <div className="job-match-badge">{job.matchScore}% Match</div>
                    )}
                  </div>
                  <div className="job-meta">
                    <span className="meta-tag">
                      <Users size={12} /> {job.applicationCount || 0} applications
                    </span>
                    <span className="meta-tag">
                      <Eye size={12} /> {job.views || 0} views
                    </span>
                  </div>
                  <div className="job-progress">
                    <div className="progress-label">
                      <span>Progress</span>
                      <span>{Math.round(((job.applicationCount || 0) / 50) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min(100, ((job.applicationCount || 0) / 50) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-jobs-message">
                <Briefcase size={24} />
                <p>No active positions yet.</p>
                <button 
                  className="btn btn-primary"
                  onClick={handlePostNewJob}
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recruitment Tips</h2>
        </div>

        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">💡</div>
            <h4>Write Compelling Job Descriptions</h4>
            <p>Clear and detailed job descriptions attract more qualified candidates and reduce irrelevant applications.</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">⚡</div>
            <h4>Respond Quickly</h4>
            <p>Candidates who receive feedback within 2 days are 50% more likely to accept offers.</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h4>Use AI Matching</h4>
            <p>Our AI algorithm matches your jobs with the most relevant candidates in your industry.</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <button 
            className="quick-action-btn"
            onClick={handlePostNewJob}
          >
            <PlusCircle size={18} />
            <span>Post New Job</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/applications')}
          >
            <FileText size={18} />
            <span>Review Applications</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/profile')}
          >
            <Building2 size={18} />
            <span>Company Profile</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/analytics')}
          >
            <TrendingUp size={18} />
            <span>View Analytics</span>
          </button>
        </div>
      </section>

      {/* Job Post Form Modal - SAME AS JobManagement */}
      {showJobForm && (
        <JobPostForm
          job={null} // New job, not editing
          onSuccess={handleJobFormSuccess}
          onCancel={handleJobFormCancel}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;