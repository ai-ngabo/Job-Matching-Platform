import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, MapPin, Building2, AlertCircle, Filter } from 'lucide-react';
import api from '../../../services/api';   // ✅ use centralized Axios service
import './Applications.css';

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    reviewing: 0,
    interview: 0,
    accepted: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchApplicationsAndStats();
  }, []);

  const fetchApplicationsAndStats = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      if (user.userType === 'jobseeker') {
        endpoint = '/applications/my-applications';
      } else if (user.userType === 'company') {
        endpoint = '/applications/company/received';
      } else {
        throw new Error('Invalid user type for applications');
      }

      console.log('📋 Fetching applications from:', endpoint);

      // ✅ Axios handles headers + JSON automatically
      const response = await api.get(endpoint);
      const data = response.data;

      console.log('✅ Applications data:', data);

      const apps = data.applications || [];
      setApplications(apps);

      // Calculate stats
      const stats = {
        total: apps.length,
        submitted: apps.filter(app => app.status === 'submitted').length,
        reviewing: apps.filter(app => app.status === 'reviewing').length,
        interview: apps.filter(app => app.status === 'interview').length,
        accepted: apps.filter(app => app.status === 'accepted').length,
        rejected: apps.filter(app => app.status === 'rejected').length
      };

      setStats(stats);

    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'submitted': return 'status-submitted';
      case 'reviewing': return 'status-reviewing';
      case 'interview': return 'status-interview';
      case 'shortlisted': return 'status-shortlisted';
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return 'status-submitted';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'reviewing': return 'Under Review';
      case 'interview': return 'Interview';
      case 'shortlisted': return 'Shortlisted';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Selected';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="applications-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applications-container">
        <div className="error-state">
          <AlertCircle size={24} />
          <div>
            <h3>Error Loading Applications</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchApplicationsAndStats} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <div className="header-content">
          <h1>
            {user.userType === 'jobseeker' ? 'My Applications' : 'Received Applications'}
          </h1>
          <p>
            {user.userType === 'jobseeker'
              ? 'Track your job applications and status updates'
              : 'Manage applications received for your job postings'
            }
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><div className="stat-number">{stats.submitted}</div><div className="stat-label">Submitted</div></div>
        <div className="stat-card"><div className="stat-number">{stats.reviewing}</div><div className="stat-label">Under Review</div></div>
        <div className="stat-card"><div className="stat-number">{stats.interview}</div><div className="stat-label">Interview</div></div>
        <div className="stat-card"><div className="stat-number">{stats.accepted}</div><div className="stat-label">Accepted</div></div>
        <div className="stat-card"><div className="stat-number">{stats.rejected}</div><div className="stat-label">Not Selected</div></div>
      </div>

      {/* Applications List */}
      <div className="applications-content">
        <div className="applications-list">
          <div className="list-header">
            <h2>{user.userType === 'jobseeker' ? 'Recent Applications' : 'All Applications'}</h2>
            <div className="list-actions">
              <button className="filter-btn"><Filter size={16} /> Filter</button>
            </div>
          </div>

          {applications.length > 0 ? (
            <div className="applications-grid">
              {applications.map((application) => (
                <div key={application._id} className="application-card">
                  <div className="application-header">
                    <div className="company-info">
                      <div className="company-logo"><Building2 size={24} /></div>
                      <div className="company-details">
                        <h3>
                          {user.userType === 'jobseeker'
                            ? application.companyName || application.job?.title
                            : application.applicantName}
                        </h3>
                        <p>
                          {user.userType === 'jobseeker'
                            ? application.jobTitle || application.job?.title
                            : `Applied for: ${application.jobTitle}`}
                        </p>
                      </div>
                    </div>
                    <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                      {getStatusText(application.status)}
                    </div>
                  </div>

                  <div className="application-details">
                    {user.userType === 'jobseeker' && application.companyName && (
                      <div className="detail-item"><Building2 size={16} /><span>{application.companyName}</span></div>
                    )}
                    {application.job?.location && (
                      <div className="detail-item"><MapPin size={16} /><span>{application.job.location}</span></div>
                    )}
                    <div className="detail-item"><Calendar size={16} /><span>Applied {formatDate(application.appliedAt)}</span></div>
                  </div>

                  <div className="application-actions">
                    <button className="btn-outline">View Details</button>
                    {user.userType === 'company' && (
                      <button className="btn-primary">Update Status</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Briefcase size={48} />
              <h3>No Applications Found</h3>
              <p>
                {user.userType === 'jobseeker'
                  ? "You haven't applied to any jobs yet. Start browsing available positions!"
                  : "No applications received yet. Applications will appear here when candidates apply to your jobs."}
              </p>
              {user.userType === 'jobseeker' && (
                <button className="btn-primary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
              )}
              {user.userType === 'company' && (
                <button className="btn-primary" onClick={() => navigate('/jobs/manage')}>Manage Jobs</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;