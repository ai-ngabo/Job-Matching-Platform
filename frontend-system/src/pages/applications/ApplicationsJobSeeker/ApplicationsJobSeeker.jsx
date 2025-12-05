import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, AlertCircle, Briefcase, Filter } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './ApplicationsJobSeeker.css';

const ApplicationsJobSeeker = () => {
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
  const [filteredStatus, setFilteredStatus] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchApplicationsAndStats();
  }, []);

  const fetchApplicationsAndStats = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = '/applications/my-applications';

      console.log('📋 Fetching applications from:', endpoint);

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
      setFilteredStatus(null); // Reset filter when fetching new data

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

  const calculateDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const handleCancelApplication = async (applicationId, currentStatus) => {
    // Only allow cancelling for non-final statuses
    const nonCancellableStatuses = ['accepted', 'rejected', 'interview'];
    if (nonCancellableStatuses.includes(currentStatus)) {
      alert(`You cannot cancel an application with status "${getStatusText(currentStatus)}".`);
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel/unsend this application? This will withdraw your application from the company.'
    );
    if (!confirmed) return;

    try {
      setCancellingId(applicationId);
      await api.delete(`/applications/${applicationId}`);

      // Remove from local state and update stats
      const remaining = applications.filter(app => app._id !== applicationId);
      setApplications(remaining);

      const updatedStats = {
        total: remaining.length,
        submitted: remaining.filter(app => app.status === 'submitted').length,
        reviewing: remaining.filter(app => app.status === 'reviewing').length,
        interview: remaining.filter(app => app.status === 'interview').length,
        accepted: remaining.filter(app => app.status === 'accepted').length,
        rejected: remaining.filter(app => app.status === 'rejected').length
      };
      setStats(updatedStats);
    } catch (error) {
      console.error('❌ Error cancelling application:', error);
      alert(error.response?.data?.message || 'Failed to cancel application. Please try again.');
    } finally {
      setCancellingId(null);
    }
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

  // Filter applications by status
  const getStatusKey = (status) => {
    switch (status) {
      case 'submitted': return 'submitted';
      case 'reviewing': return 'reviewing';
      case 'interview': return 'interview';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      default: return null;
    }
  };

  const filteredApplications = filteredStatus 
    ? applications.filter(app => getStatusKey(app.status) === filteredStatus)
    : applications;

  return (
    <div className="applications-container">
      <div className="applications-header">
        <div className="header-content">
          <h1>My Applications</h1>
          <p className="header-subtitle">Track your job applications and status updates</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div 
          className={`stat-card ${filteredStatus === null ? 'active' : ''}`}
          onClick={() => setFilteredStatus(null)}
        >
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div 
          className={`stat-card ${filteredStatus === 'submitted' ? 'active' : ''}`}
          onClick={() => setFilteredStatus('submitted')}
        >
          <div className="stat-number">{stats.submitted}</div>
          <div className="stat-label">Submitted</div>
        </div>
        <div 
          className={`stat-card ${filteredStatus === 'reviewing' ? 'active' : ''}`}
          onClick={() => setFilteredStatus('reviewing')}
        >
          <div className="stat-number">{stats.reviewing}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div 
          className={`stat-card ${filteredStatus === 'interview' ? 'active' : ''}`}
          onClick={() => setFilteredStatus('interview')}
        >
          <div className="stat-number">{stats.interview}</div>
          <div className="stat-label">Interview</div>
        </div>
        <div 
          className={`stat-card ${filteredStatus === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilteredStatus('accepted')}
        >
          <div className="stat-number">{stats.accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div 
          className={`stat-card ${filteredStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilteredStatus('rejected')}
        >
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Not Selected</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-content">
        <div className="applications-list">
          <div className="list-header">
            <h2>Recent Applications</h2>
            <div className="list-actions">
              <button className="filter-btn"><Filter size={16} /> Filter</button>
            </div>
          </div>

          {filteredApplications.length > 0 ? (
            <div className="applications-grid">
              {filteredApplications.map((application) => (
                <div key={application._id} className="application-card">
                  <div className="application-header">
                    <div className="company-info">
                      <div className="company-logo"><Building2 size={24} /></div>
                      <div className="company-details">
                        <h3>{application.companyName || application.job?.title}</h3>
                        <p>{application.jobTitle || application.job?.title}</p>
                      </div>
                    </div>
                    <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                      {getStatusText(application.status)}
                    </div>
                  </div>

                  <div className="application-details">
                    {application.companyName && (
                      <div className="detail-item"><Building2 size={16} /><span>{application.companyName}</span></div>
                    )}
                    {application.job?.location && (
                      <div className="detail-item"><MapPin size={16} /><span>{application.job.location}</span></div>
                    )}
                    <div className="detail-item"><Calendar size={16} /><span>Applied: {formatDate(application.appliedAt)}</span></div>
                    {application.job?.applicationDeadline && (
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>
                          Deadline: {formatDate(application.job.applicationDeadline)}
                          {calculateDaysUntilDeadline(application.job.applicationDeadline) > 0 && 
                            ` (${calculateDaysUntilDeadline(application.job.applicationDeadline)} days left)`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="application-actions">
                    <button 
                      className="btn-outline"
                      onClick={() => navigate(`/jobs/${application.job?._id}`)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn-danger"
                      disabled={cancellingId === application._id}
                      onClick={() => handleCancelApplication(application._id, application.status)}
                    >
                      {cancellingId === application._id ? 'Cancelling...' : 'Cancel Application'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Briefcase size={48} />
              <h3>No Applications Found</h3>
              <p>{filteredStatus ? `No applications with status "${filteredStatus}".` : "You haven't applied to any jobs yet. Start browsing available positions!"}</p>
              <button className="btn-primary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsJobSeeker;
