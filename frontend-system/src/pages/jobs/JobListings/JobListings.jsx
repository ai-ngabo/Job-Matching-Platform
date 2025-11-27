import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Building2, Clock, DollarSign, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './JobListings.css';

const JobListings = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [filters, setFilters] = useState({
    jobType: '',
    category: '',
    location: '',
    minSalary: ''
  });

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  const categories = ['technology', 'business', 'healthcare', 'education', 'engineering', 'design', 'marketing', 'sales', 'customer-service'];

  // Fetch real jobs from API
  useEffect(() => {
    fetchJobs();
    // Load saved jobs from localStorage
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobs(saved);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/jobs?limit=50&sortBy=createdAt&sortOrder=desc`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
      const activeJobs = data.jobs || [];
      
      // Transform backend data to match frontend format
      const transformedJobs = activeJobs.map(job => ({
        _id: job._id,
        id: job._id,
        title: job.title || 'Untitled Position',
        company: job.companyName || 'Company Name',
        companyLogo: job.company?.company?.logo || '',
        location: job.location || 'Location not specified',
        salary: job.salaryRange?.min && job.salaryRange?.max 
          ? `${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
          : 'Salary not specified',
        type: job.jobType || 'full-time',
        category: job.category || 'other',
        postedDate: new Date(job.createdAt).toLocaleDateString(),
        description: job.description || '',
        requirements: job.requirements || [],
        skills: job.skillsRequired || [],
        views: job.views || 0,
        applications: job.applicationCount || 0,
        matchScore: Math.floor(Math.random() * 30) + 70 // Placeholder match score
      }));

      setJobs(transformedJobs);
      setFilteredJobs(transformedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  // Toggle save job
  const toggleSaveJob = (jobId) => {
    console.log('💾 Toggling save for job:', jobId);
    let updated = [...savedJobs];
    if (updated.includes(jobId)) {
      updated = updated.filter(id => id !== jobId);
      console.log('  → Removed from saved jobs');
    } else {
      updated.push(jobId);
      console.log('  → Added to saved jobs');
    }
    console.log('  📝 Updated saved list:', updated);
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    console.log('  ✅ Stored in localStorage');
    
    // Dispatch storage event for navbar badge and saved jobs page update
    window.dispatchEvent(new Event('storage'));
    console.log('  📢 Storage event dispatched');
  };

  // View job details
  const viewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Filter jobs based on search and filters
  useEffect(() => {
    let result = jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filters.jobType) {
      result = result.filter(job => job.type === filters.jobType);
    }
    if (filters.category) {
      result = result.filter(job => job.category === filters.category);
    }
    if (filters.location) {
      result = result.filter(job => job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  return (
    <div className="job-listings-container">
      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-filters-flex">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filters-container">
            <select
              className="filter-select"
              value={filters.jobType}
              onChange={(e) => setFilters({...filters, jobType: e.target.value})}
            >
              <option value="">All Types</option>
              {jobTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              className="filter-select"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchJobs} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading jobs from our database...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredJobs.length === 0 && (
        <div className="empty-state">
          <p>No jobs found matching your criteria.</p>
          <button onClick={() => {
            setSearchTerm('');
            setFilters({ jobType: '', category: '', location: '', minSalary: '' });
          }} className="reset-btn">
            Clear Filters
          </button>
        </div>
      )}

      {/* Job List */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="jobs-grid">
          {filteredJobs.map(job => (
            <div key={job._id} className="job-card">
              {/* Card Header */}
              <div className="card-header">
                <div className="logo-wrapper">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.company} className="company-logo" />
                  ) : (
                    <Building2 size={40} className="logo-placeholder" />
                  )}
                </div>
                <button 
                  className={`save-btn ${savedJobs.includes(job._id) ? 'saved' : ''}`}
                  onClick={() => toggleSaveJob(job._id)}
                  title={savedJobs.includes(job._id) ? 'Remove from saved' : 'Save job'}
                >
                  {savedJobs.includes(job._id) ? (
                    <BookmarkCheck size={20} />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </button>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <h3 className="job-title">{job.title}</h3>
                <p className="company-name">{job.company}</p>

                {/* Quick Stats */}
                <div className="stats-row">
                  <div className="stat">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                  <div className="stat">
                    <DollarSign size={14} />
                    <span>{job.salary}</span>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="meta-tags">
                  <span className="tag type">{job.type}</span>
                  <span className="tag category">{job.category}</span>
                  <span className="tag match">{job.matchScore}% Match</span>
                </div>

                {/* Description Preview */}
                <p className="job-description">
                  {job.description?.substring(0, 100)}...
                </p>

                {/* Footer Stats */}
                <div className="card-footer-stats">
                  <div className="footer-stat">
                    <span>{job.views} views</span>
                  </div>
                  <div className="footer-stat">
                    <span>{job.applications} applications</span>
                  </div>
                  <div className="footer-stat">
                    <span>{job.postedDate}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
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

export default JobListings;