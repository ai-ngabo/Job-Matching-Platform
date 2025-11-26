import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  Zap,
  Download,
  User,
  Check,
  Clock,
  Eye,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import api from '../../../services/api';
import ProfileModal from '../../../components/shared/ProfileModal/ProfileModal';
import './ApplicationsCompany.css';

const ApplicationsCompany = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [cvViewer, setCvViewer] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [qualificationScores, setQualificationScores] = useState({});
  const [shortlistedCandidates, setShortlistedCandidates] = useState(new Set());

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const query = statusFilter ? `&status=${statusFilter}` : '';
      const response = await api.get(`/applications/company/received?limit=50${query}`);
      setApplications(response.data.applications || []);
      
      // Score all applications
      scoreApplications(response.data.applications);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreApplications = async (apps) => {
    const scores = {};
    for (const app of apps) {
      try {
        const response = await api.get(`/ai/qualification-score/${app._id}`);
        scores[app._id] = response.data.qualificationScore || 0;
      } catch (err) {
        console.error('Error scoring application:', err);
        scores[app._id] = 0;
      }
    }
    setQualificationScores(scores);
  };

  const updateApplicationStatus = async (applicationId, newStatus, note = '') => {
    try {
      await api.put(`/applications/${applicationId}/status`, {
        status: newStatus,
        note
      });
      
      // Update local state
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      setSelectedApplication(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const toggleShortlist = async (applicationId) => {
    try {
      await api.put(`/ai/shortlist/${applicationId}`);
      const newShortlisted = new Set(shortlistedCandidates);
      if (newShortlisted.has(applicationId)) {
        newShortlisted.delete(applicationId);
      } else {
        newShortlisted.add(applicationId);
      }
      setShortlistedCandidates(newShortlisted);
    } catch (err) {
      console.error('Error updating shortlist:', err);
      alert('Failed to update shortlist');
    }
  };

  const getQualificationColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getQualificationLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvatarInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || 'A'}${lastName?.charAt(0) || 'B'}`.toUpperCase();
  };

  const getProfilePicture = (applicant) => {
    return applicant?.profile?.profilePicture?.url || null;
  };

  if (loading) {
    return (
      <div className="applications-company-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-company-container">
      {/* Header */}
      <div className="company-apps-header">
        <div className="header-content">
          <h1>Received Applications</h1>
          <p>Review and manage applications from job seekers</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-label">Total</span>
            <span className="stat-value">{applications.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Shortlisted</span>
            <span className="stat-value">{shortlistedCandidates.size}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${!statusFilter ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All ({applications.length})
        </button>
        <button
          className={`filter-tab ${statusFilter === 'submitted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('submitted')}
        >
          New
        </button>
        <button
          className={`filter-tab ${statusFilter === 'reviewing' ? 'active' : ''}`}
          onClick={() => setStatusFilter('reviewing')}
        >
          Reviewing
        </button>
        <button
          className={`filter-tab ${statusFilter === 'shortlisted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('shortlisted')}
        >
          Shortlisted
        </button>
        <button
          className={`filter-tab ${statusFilter === 'interview' ? 'active' : ''}`}
          onClick={() => setStatusFilter('interview')}
        >
          Interview
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Applications Grid */}
      {applications.length > 0 ? (
        <div className="applications-grid">
          {applications.map((application) => (
            <div
              key={application._id}
              className={`application-card ${shortlistedCandidates.has(application._id) ? 'shortlisted' : ''}`}
            >
              {/* Card Header - Profile Section */}
              <div className="card-profile-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">
                    {getProfilePicture(application.applicant) ? (
                      <img
                        src={getProfilePicture(application.applicant)}
                        alt={application.applicant?.profile?.firstName}
                        className="profile-picture"
                      />
                    ) : (
                      <div className="avatar-initials">
                        {getAvatarInitials(application.applicant?.profile?.firstName, application.applicant?.profile?.lastName)}
                      </div>
                    )}
                    {shortlistedCandidates.has(application._id) && (
                      <div className="shortlist-badge">⭐</div>
                    )}
                  </div>
                  {/* Status Badge - Positioned on top right */}
                  <div className="status-badge" data-status={application.status}>
                    {application.status}
                  </div>
                </div>
                
                <div className="profile-info">
                  <h3 
                    className="candidate-name"
                    onClick={() => setSelectedProfile(application.applicant)}
                    title="Click to view full profile"
                  >
                    {application.applicant?.profile?.firstName} {application.applicant?.profile?.lastName}
                  </h3>
                  <p className="candidate-email">{application.applicantEmail}</p>
                  <div className="job-applied-for">
                    <Briefcase size={12} />
                    <span>{application.jobTitle || 'Position'}</span>
                  </div>
                </div>
              </div>

              {/* Qualification Score */}
              <div className="qualification-score">
                <div className="score-header">
                  <Zap size={16} />
                  <span>AI Match Score</span>
                </div>
                <div className="score-container">
                  <div className="score-circle" style={{ borderColor: getQualificationColor(qualificationScores[application._id] || 0) }}>
                    <span className="score-value" style={{ color: getQualificationColor(qualificationScores[application._id] || 0) }}>
                      {qualificationScores[application._id] || 0}%
                    </span>
                  </div>
                  <span className="score-label" style={{ color: getQualificationColor(qualificationScores[application._id] || 0) }}>
                    {getQualificationLabel(qualificationScores[application._id] || 0)}
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="application-details">
                <div className="detail-item">
                  <Calendar size={14} />
                  <span>Applied {formatDate(application.appliedAt)}</span>
                </div>
                <div className="detail-item">
                  <Clock size={14} />
                  <span>{application.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="card-actions">
                {application.applicant?.profile?.documents?.cv?.url && (
                  <button
                    onClick={() => setCvViewer(application.applicant.profile.documents.cv.url)}
                    className="action-btn cv-btn"
                    title="View CV in modal"
                  >
                    <FileText size={14} />
                    View CV
                  </button>
                )}
                <button
                  className={`action-btn shortlist-btn ${shortlistedCandidates.has(application._id) ? 'active' : ''}`}
                  onClick={() => toggleShortlist(application._id)}
                >
                  <Check size={14} />
                  Shortlist
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => setSelectedApplication(application)}
                >
                  <Eye size={14} />
                  View
                </button>
              </div>

              {/* Status Badge */}
              <div className="status-badge" data-status={application.status}>
                {application.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>No applications found</h3>
          <p>Applications will appear here when job seekers apply to your positions</p>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedApplication(null)}
            >
              ×
            </button>

            <div className="modal-header">
              <div className="modal-profile">
                {getProfilePicture(selectedApplication.applicant) ? (
                  <img
                    src={getProfilePicture(selectedApplication.applicant)}
                    alt={selectedApplication.applicant?.profile?.firstName}
                    className="modal-profile-picture"
                  />
                ) : (
                  <div className="modal-avatar-initials">
                    {getAvatarInitials(selectedApplication.applicant?.profile?.firstName, selectedApplication.applicant?.profile?.lastName)}
                  </div>
                )}
              </div>
              <div className="modal-candidate-info">
                <h2>
                  {selectedApplication.applicant?.profile?.firstName} {selectedApplication.applicant?.profile?.lastName}
                </h2>
                <p>{selectedApplication.applicantEmail}</p>
                <button
                  className="view-full-profile-btn"
                  onClick={() => {
                    setSelectedProfile(selectedApplication.applicant);
                    setSelectedApplication(null);
                  }}
                >
                  View Full Profile
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Application Details</h3>
                <div className="detail-row">
                  <span className="label">Position:</span>
                  <span className="value">{selectedApplication.jobTitle}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Applied:</span>
                  <span className="value">{formatDate(selectedApplication.appliedAt)}</span>
                </div>
              </div>

              <div className="modal-section">
                <h3>Cover Letter</h3>
                <p className="cover-letter">
                  {selectedApplication.coverLetter || 'No cover letter provided'}
                </p>
              </div>

              <div className="modal-section">
                <h3>Update Status</h3>
                <div className="status-buttons">
                  <button
                    className={`status-btn ${selectedApplication.status === 'reviewing' ? 'active' : ''}`}
                    onClick={() => updateApplicationStatus(selectedApplication._id, 'reviewing', 'Reviewing application')}
                  >
                    Under Review
                  </button>
                  <button
                    className={`status-btn ${selectedApplication.status === 'shortlisted' ? 'active' : ''}`}
                    onClick={() => updateApplicationStatus(selectedApplication._id, 'shortlisted', 'Candidate shortlisted')}
                  >
                    Shortlist
                  </button>
                  <button
                    className={`status-btn ${selectedApplication.status === 'interview' ? 'active' : ''}`}
                    onClick={() => updateApplicationStatus(selectedApplication._id, 'interview', 'Interview scheduled')}
                  >
                    Interview
                  </button>
                  <button
                    className={`status-btn ${selectedApplication.status === 'accepted' ? 'active' : ''}`}
                    onClick={() => updateApplicationStatus(selectedApplication._id, 'accepted', 'Job offered')}
                  >
                    Accepted
                  </button>
                  <button
                    className={`status-btn ${selectedApplication.status === 'rejected' ? 'active' : ''}`}
                    onClick={() => updateApplicationStatus(selectedApplication._id, 'rejected', 'Application rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV Viewer Modal */}
      {cvViewer && (
        <div className="modal-overlay" onClick={() => setCvViewer(null)}>
          <div className="modal-content cv-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setCvViewer(null)}
              aria-label="Close CV viewer"
            >
              ×
            </button>
            <div className="cv-viewer-container">
              <div className="cv-viewer-header">
                <FileText size={24} />
                <h2>Candidate CV</h2>
              </div>
              <div className="cv-viewer-body">
                {cvViewer.endsWith('.pdf') ? (
                  <iframe
                    src={cvViewer}
                    title="Candidate CV"
                    className="cv-iframe"
                    frameBorder="0"
                  />
                ) : (
                  <div className="cv-file-viewer">
                    <p className="cv-file-notice">Document preview not available</p>
                    <a 
                      href={cvViewer} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-btn"
                    >
                      <Download size={14} />
                      Download CV
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal 
          applicant={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </div>
  );
};

export default ApplicationsCompany;
