import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Bookmark, 
  BookmarkCheck,
  MapPin,
  DollarSign,
  Briefcase,
  Search,
  Trash2,
  AlertCircle,
  Building2,
  Eye,
  Clock
} from 'lucide-react';
import './SavedJobs.css';

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('SavedJobs component mounted');
    loadSavedJobs();
    
    // Listen for storage changes (when saved from other tabs/pages)
    const handleStorageChange = (e) => {
      console.log('Storage change detected:', e);
      if (e.key === 'savedJobs' || e.key === null) {
        console.log('Saved jobs changed, reloading...');
        loadSavedJobs();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom storage events
    window.addEventListener('storage', () => {
      const saved = JSON.parse(localStorage.getItem('savedJobs')) || [];
      console.log('Current saved jobs in storage:', saved);
    });
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      
      // Get saved job IDs from localStorage
      const saved = JSON.parse(localStorage.getItem('savedJobs')) || [];
      console.log('📥 Saved job IDs from localStorage:', saved);
      console.log('📊 Number of saved jobs:', saved.length);
      setSavedJobIds(saved);

      if (saved.length === 0) {
        console.log('⚠️ No saved jobs found');
        setJobs([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching details for saved jobs...');
      
      // Fetch full job details for each saved job
      const jobsData = await Promise.all(
        saved.map(jobId => {
          console.log(`  → Fetching job: ${jobId}`);
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          return fetch(`${apiBase}/jobs/${jobId}`)
            .then(res => {
              console.log(`  ← Response for ${jobId}: ${res.status}`);
              if (!res.ok) {
                console.warn(`  ⚠️ Response not ok for ${jobId}`);
                return null;
              }
              return res.json();
            })
            .catch(err => {
              console.error(`  ✗ Error fetching ${jobId}:`, err);
              return null;
            });
        })
      );

      console.log('📦 Raw response data:', jobsData);

      // Extract job from response wrapper if needed and filter valid jobs
      const jobsList = jobsData.map(response => {
        if (!response) return null;
        // API returns { job: {...}, message: '...' }
        const jobData = response.job || response;
        return jobData;
      });

      console.log('📋 Extracted job data:', jobsList);

      // Filter out failed requests and invalid jobs
      const validJobs = jobsList.filter(job => job && job._id && job.title);
      console.log('✅ Valid jobs after filtering:', validJobs);
      
      setJobs(validJobs);
      setError('');
    } catch (err) {
      console.error('❌ Error loading saved jobs:', err);
      setError(err.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = (jobId) => {
    const updated = savedJobIds.filter(id => id !== jobId);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSavedJobIds(updated);
    setJobs(jobs.filter(job => job._id !== jobId));
    
    // Dispatch storage event for navbar badge update
    window.dispatchEvent(new Event('storage'));
  };

  const viewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredJobs = jobs.filter(job =>
    (job?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job?.company?.company?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job?.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="saved-jobs-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-container">
      {/* Header */}
      <div className="saved-jobs-header">
        <div className="header-content">
          <h1>
            <BookmarkCheck size={32} />
            Saved Jobs
          </h1>
          <p>Your collection of jobs you're interested in</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <Bookmark size={20} />
            <span>{jobs.length} Saved</span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <AlertCircle size={24} />
          <p>{error}</p>
          <button className="retry-btn" onClick={loadSavedJobs}>
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      {jobs.length > 0 && (
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {searchTerm && (
            <p className="search-results">
              Found {filteredJobs.length} of {jobs.length} saved jobs
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <BookmarkCheck size={64} />
          <h2>No Saved Jobs Yet</h2>
          <p>Browse job listings and save your favorite opportunities</p>
          <button 
            className="browse-btn"
            onClick={() => navigate('/jobs')}
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        /* Jobs Grid */
        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job._id} className="job-card">
              {/* Card Header with Logo and Remove */}
              <div className="card-header">
                <div className="logo-wrapper">
                  {job.company?.company?.logo ? (
                    <img 
                      src={job.company?.company?.logo} 
                      alt={job.company?.company?.name}
                      className="company-logo"
                    />
                  ) : (
                    <Building2 size={40} className="logo-placeholder" />
                  )}
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeSavedJob(job._id)}
                  title="Remove from saved"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Main Content */}
              <div className="card-body">
                <h3 className="job-title">{job.title}</h3>
                <p className="company-name">{job.company?.company?.name || 'Company'}</p>

                {/* Quick Stats Row */}
                <div className="stats-row">
                  <div className="stat">
                    <MapPin size={14} />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="stat">
                    <DollarSign size={14} />
                    <span>
                      {job.salaryMin && job.salaryMax
                        ? `${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k`
                        : 'Competitive'}
                    </span>
                  </div>
                </div>

                {/* Experience & Type */}
                <div className="meta-tags">
                  {job.experienceLevel && (
                    <span className="tag experience">{job.experienceLevel}</span>
                  )}
                  {job.jobType && (
                    <span className="tag type">{job.jobType}</span>
                  )}
                </div>

                {/* Description Preview */}
                <p className="job-description">
                  {job.description?.substring(0, 100)}...
                </p>

                {/* Stats Footer */}
                <div className="card-footer-stats">
                  <div className="footer-stat">
                    <Eye size={14} />
                    <span>{job.views || 0} views</span>
                  </div>
                  <div className="footer-stat">
                    <Briefcase size={14} />
                    <span>{job.applicationCount || 0} apps</span>
                  </div>
                  <div className="footer-stat">
                    <Clock size={14} />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="card-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => viewJobDetails(job._id)}
                >
                  View Details
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => viewJobDetails(job._id)}
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
