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
  AlertCircle
} from 'lucide-react';
import api from '../../../services/api';  
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ Axios handles token automatically via interceptor
      const jobsResponse = await api.get('/jobs/company/my-jobs');
      const companyJobs = jobsResponse.data.jobs || [];

      const applicationsResponse = await api.get('/applications/company/received?limit=5');
      const companyApplications = applicationsResponse.data.applications || [];

      // Calculate stats
      const activeJobs = companyJobs.filter(j => j.status === 'active').length;
      const totalViews = companyJobs.reduce((sum, job) => sum + (job.views || 0), 0);
      const totalApplications = companyJobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0);
      const newApplications = companyApplications.filter(app => !app.viewedByCompany).length;

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'submitted': return 'new';
      case 'reviewing': return 'reviewing';
      case 'interview': return 'interview';
      case 'shortlisted': return 'shortlisted';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      default: return 'new';
    }
  };

  if (loading) {
    return (
      <div className="company-dashboard">
        <div className="dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  const topJobs = jobs
    .filter(j => j.status === 'active')
    .sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0))
    .slice(0, 3);

  const engagementRate = stats.totalJobs > 0
    ? Math.round((stats.totalApplications / (stats.profileViews || 1)) * 100 * 10) / 10
    : 0;

  return (
    <div className="company-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user.company?.name}!</h1>
          <p>Manage your recruitment and connect with top talent</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/jobs/manage')}>
          <Briefcase size={16} /> Post New Job
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon briefcase"><Briefcase size={24} /></div>
          <div className="stat-content">
            <h3>Active Job Postings</h3>
            <div className="stat-value">{stats.activeJobs}</div>
            <p className="stat-subtext">{stats.totalJobs} total posted</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon applications"><Users size={24} /></div>
          <div className="stat-content">
            <h3>Applications</h3>
            <div className="stat-value">{stats.totalApplications}</div>
            <p className="stat-subtext highlight">{stats.newApplications} new applications</p>
          </div>
        </div>

        <div className="stat-card">
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
            <button className="view-all" onClick={() => navigate('/applications')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="applications-list">
            {applications.length > 0 ? (
              applications.slice(0, 3).map((application) => (
                <div key={application._id} className="application-item">
                  <div className="app-avatar">
                    {getProfilePictureUrl(application.applicant?.profile?.profilePicture) ? (
                      <img 
                        src={getProfilePictureUrl(application.applicant.profile.profilePicture)}
                        alt={`${application.applicant?.profile?.firstName} ${application.applicant?.profile?.lastName}`}
                        className="app-avatar-img"
                      />
                    ) : (
                      getInitials(application.applicant?.profile?.firstName, application.applicant?.profile?.lastName)
                    )}
                  </div>
                  <div className="app-info">
                    <h4>{application.applicant?.profile?.firstName} {application.applicant?.profile?.lastName}</h4>
                    <p>{application.jobTitle || application.job?.title || 'Position'}</p>
                    <span className="app-date"><Calendar size={12} /> {formatDate(application.appliedAt)}</span>
                    {application.applicant?.profile?.documents?.cv?.url && (
                      <a href={application.applicant.profile.documents.cv.url} target="_blank" rel="noopener noreferrer" className="cv-link">
                        View CV
                      </a>
                    )}
                  </div>
                  <div className="app-status">
                    <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                      {application.status || 'new'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-applications">
                <AlertCircle size={20} />
                <p>No applications received yet</p>
                <small>Applications will appear here when job seekers apply to your positions</small>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Open Positions</h2>
            <button className="view-all" onClick={() => navigate('/jobs/manage')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="jobs-list">
            {topJobs.length > 0 ? (
              topJobs.map((job) => (
                <div key={job._id} className="job-item">
                  <h4>{job.title}</h4>
                  <div className="job-meta">
                    <span className="meta-tag"><Users size={12} /> {job.applicationCount || 0} applications</span>
                    <span className="meta-tag"><Eye size={12} /> {job.views || 0} views</span>
                  </div>
                  <div className="job-progress">
                    <div className="progress-bar">
                      <div style={{ width: `${Math.min(100, ((job.applicationCount || 0) / 10) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-jobs-message">
                <p>No active positions yet.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/jobs/manage')}
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
    </div>
  );
};

export default CompanyDashboard;