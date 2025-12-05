import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Building2, Bookmark, BookmarkCheck, AlertCircle } from 'lucide-react';
import './JobDetails.css';
import api from '../../../services/api';

const JobDetails = () => {
  const { jobId } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  // AI Match Score state
  const [aiMatchScore, setAiMatchScore] = useState(null);
  const [aiMatchLabel, setAiMatchLabel] = useState('');

  useEffect(() => {
    fetchJobDetails();
    checkIfSaved();
    fetchAiMatchScore();
  }, [jobId]); 

  // Check if this job is saved in localStorage
  const checkIfSaved = () => {
    try {
      const savedList = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSaved(Array.isArray(savedList) && savedList.includes(jobId));
    } catch (e) {
      setSaved(false);
    }
  };

  const toggleSaveJob = () => {
    try {
      const savedList = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      let updated = Array.isArray(savedList) ? [...savedList] : [];
      if (updated.includes(jobId)) {
        updated = updated.filter(id => id !== jobId);
        setSaved(false);
      } else {
        updated.push(jobId);
        setSaved(true);
      }
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error toggling saved job:', e);
    }
  };
  // Fetch AI match score for jobseeker
  const fetchAiMatchScore = async () => {
    if (!user || user.userType !== 'jobseeker') return;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${apiBase}/ai/match-score/${jobId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setAiMatchScore(data.matchScore);
      setAiMatchLabel(data.matchLevel);
    } catch (e) {
      setAiMatchScore(null);
      setAiMatchLabel('');
    }
  };
  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const url = `${apiBase}/jobs/${jobId}`;

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const jobData = data.job || data;

      setJob(jobData);
    } catch (err) {
      console.error('Fetch job details error:', err);
      setError(err.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };
  const handleApply = async () => {
    try {
      // Get token from proper storage
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      if (!token) {
        console.log('❌ No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('📝 Starting application for job:', jobId);
      console.log('🔑 Using token:', token.substring(0, 20) + '...');

      setApplying(true);
      setError(null);

      // ✅ Use the centralized api service
      const response = await api.post(`/applications/job/${jobId}`, {
        coverLetter: `I'm interested in the ${job?.title} position at ${job?.companyName}. I believe my skills and experience make me a strong candidate for this role.`
      });

      console.log('✅ Application successful:', response.data);

      setApplicationSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setApplicationSuccess(false);
      }, 5000);

    } catch (err) {
      console.error('❌ Application error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit application';
      setError(errorMsg);

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="job-details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-details-container">
        <button className="back-btn" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={20} />
          Back to Jobs
        </button>
        <div className="error-state">
          <AlertCircle size={24} />
          <p>{error || 'Job not found'}</p>
          <button className="retry-btn" onClick={fetchJobDetails}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isCompanyView = location?.state?.companyView || user?.userType === 'company';

  return (
    <div className="job-details-container">
      {/* Header with Back Button */}
      <div className="job-details-header">
        <button className="back-btn" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={20} />
          Back to Jobs
        </button>
      </div>

      {/* Main Content */}
      <div className="job-details-content">
        {/* Left Column - Job Information */}
        <div className="job-details-main">
          {/* Company Header */}
          <div className="company-header">
            <div className="company-logo-large">
              {job.company?.company?.logo || job.company?.logo ? (
                <img 
                  src={job.company?.company?.logo || job.company?.logo} 
                  alt={job.company?.company?.name || job.companyName || 'Company'}
                  className="company-logo-img"
                />
              ) : (
                <Building2 size={48} className="logo-placeholder" />
              )}
            </div>
            <div className="company-info">
              <h1 className="job-title">{job.title}</h1>
              <p className="company-name">{job.company?.company?.name || job.companyName || 'Company'}</p>
              <p className="company-industry">
                {job.company?.company?.industry || job.company?.industry || 'Industry not specified'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-box">
              <MapPin size={20} />
              <div>
                <p className="stat-label">Location</p>
                <p className="stat-value">{job.location || 'Remote'}</p>
              </div>
            </div>
            <div className="stat-box">
              <DollarSign size={20} />
              <div>
                <p className="stat-label">Salary</p>
                <p className="stat-value">
                  {job.salaryMin && job.salaryMax
                    ? `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                    : 'Competitive'}
                </p>
              </div>
            </div>
            <div className="stat-box">
              <Briefcase size={20} />
              <div>
                <p className="stat-label">Experience</p>
                <p className="stat-value">{job.experienceLevel || 'Not specified'}</p>
              </div>
            </div>
            <div className="stat-box">
              <Clock size={20} />
              <div>
                <p className="stat-label">Posted</p>
                <p className="stat-value">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="job-section">
            <h2>Job Description</h2>
            <p className="description-text">
              {job.description || 'No description provided'}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="job-section">
              <h2>Requirements</h2>
              <ul className="requirements-list">
                {job.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="job-section">
              <h2>Required Skills</h2>
              <div className="skills-container">
                {job.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Stats */}
          <div className="job-engagement">
            <div className="engagement-stat">
              <span className="stat-number">{job.views || 0}</span>
              <span className="stat-text">Views</span>
            </div>
            <div className="engagement-stat">
              <span className="stat-number">{job.applications || 0}</span>
              <span className="stat-text">Applications</span>
            </div>
          </div>
        </div>

        {/* Right Column - Application Card */}
        <div className="job-details-sidebar">
          <div className="application-card">
            {!isCompanyView && (
              <>
                <h3>Ready to Apply?</h3>

                {applicationSuccess && (
                  <div className="success-message">
                    ✓ Application submitted successfully!
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button 
                  className="apply-btn"
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>

                <button 
                  className={`save-job-btn-sidebar ${saved ? 'saved' : ''}`}
                  onClick={toggleSaveJob}
                >
                  {saved ? (
                    <>
                      <BookmarkCheck size={18} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={18} />
                      Save Job
                    </>
                  )}
                </button>
              </>
            )}

            {isCompanyView && (
              <>
                <h3>Manage Posting</h3>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button className="btn" onClick={() => navigate('/jobs/manage', { state: { editJobId: job._id } })}>
                    Edit Job
                  </button>
                  <button className="btn" onClick={() => navigate('/jobs/manage')}>
                    View All My Jobs
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Company Contact Card */}
          {(job.company || job.companyName) && (
            <div className="company-card">
              <h3>About Company</h3>
              <p className="company-about">
                {job.company?.company?.description || job.company?.description || 'Company information not available'}
              </p>
              {(job.company?.company?.website || job.company?.website) && (
                <a 
                  href={job.company?.company?.website || job.company?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-website-link"
                >
                  Visit Website →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetails;