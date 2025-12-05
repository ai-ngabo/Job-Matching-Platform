import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Building2, Clock, DollarSign, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
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
  const [matchScoreByJob, setMatchScoreByJob] = useState({}); // Stable AI match scores per job for this user
  const [matchBreakdownByJob, setMatchBreakdownByJob] = useState({});
  const [openBreakdownId, setOpenBreakdownId] = useState(null);

  // Fetch real jobs from API
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchRecommendedMatches(), fetchJobs()]);
      // Load saved jobs from localStorage
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobs(saved);
    };

    init();
  }, []);

  // Fetch AI recommended jobs for the current job seeker and build a stable match score map
  const fetchRecommendedMatches = async () => {
    try {
      const response = await api.get('/jobs/recommended?limit=50');
      const data = response.data || {};
      const recommendedJobs = Array.isArray(data.data) ? data.data : [];

      const scores = {};
      recommendedJobs.forEach(job => {
        if (job._id && typeof job.matchScore === 'number') {
          scores[job._id] = job.matchScore;
        }
      });

      setMatchScoreByJob(scores);
    } catch (error) {
      console.error('❌ Error fetching AI match scores for jobs list:', error);
      // Fail silently; job list will still work without match scores
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/jobs', {
        params: {
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      const activeJobs = response.data.jobs || [];
      
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
        // Stable AI match score per job for this user (from /jobs/recommended)
        // Prefer server-provided job.matchScore (API /api/jobs now returns per-job matchScore when auth present)
        matchScore: typeof job.matchScore === 'number'
          ? job.matchScore
          : (typeof matchScoreByJob[job._id] === 'number' ? matchScoreByJob[job._id] : null)
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

  // Small animated count-up component for match %
  const AnimatedMatch = ({ score }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      if (typeof score !== 'number' || score === null) return;
      let frame = null;
      let start = null;
      const duration = 800; // ms
      const to = Math.max(0, Math.min(100, Math.round(score)));

      const easeOutCubic = (t) => (--t) * t * t + 1;

      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const value = Math.round(to * easeOutCubic(progress));
        setDisplay(value);
        if (progress < 1) frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);

      return () => {
        if (frame) cancelAnimationFrame(frame);
      };
    }, [score]);

    if (typeof score !== 'number' || score === null) return null;

    return (
      <button
        className="tag match"
        role="button"
        aria-label={`${score}% match - click for breakdown`}
        onClick={async (e) => {
          e.stopPropagation();
          // parent will set which id is opening; but here we optimistically toggle based on job id carried via dataset
          const jobId = e.currentTarget.closest('[data-job-id]')?.getAttribute('data-job-id');
          if (!jobId) return;
          if (openBreakdownId === jobId) {
            setOpenBreakdownId(null);
            return;
          }
          // fetch breakdown if needed
          await fetchMatchBreakdown(jobId);
          setOpenBreakdownId(jobId);
        }}
      >{display}% Match</button>
    );
  };

  // Fetch detailed breakdown for a specific job (cached)
  const fetchMatchBreakdown = async (jobId) => {
    if (!jobId) return null;
    if (matchBreakdownByJob[jobId]) return matchBreakdownByJob[jobId];

    try {
      const res = await api.get(`/ai/match-score/${jobId}`);
      const payload = res.data || {};
      const breakdown = payload.matchBreakdown || payload.breakdown || payload;
      setMatchBreakdownByJob(prev => ({ ...prev, [jobId]: breakdown }));
      return breakdown;
    } catch (err) {
      console.error('Error fetching match breakdown for', jobId, err);
      setMatchBreakdownByJob(prev => ({ ...prev, [jobId]: null }));
      return null;
    }
  };

  // Filter jobs based on multi-field search and filters (name, company, field, skills, job type, location)
  useEffect(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    
    let result = jobs.filter(job => {
      // If search term is empty, include all jobs
      if (!searchLower) return true;
      
      // Search across multiple fields:
      // 1. Job title/name
      const titleMatch = job.title?.toLowerCase().includes(searchLower);
      
      // 2. Company name
      const companyMatch = job.company?.toLowerCase().includes(searchLower);
      
      // 3. Category/field
      const categoryMatch = job.category?.toLowerCase().includes(searchLower);
      
      // 4. Location
      const locationMatch = job.location?.toLowerCase().includes(searchLower);
      
      // 5. Job type (full-time, remote, etc.)
      const typeMatch = job.type?.toLowerCase().includes(searchLower);
      
      // 6. Required skills
      const skillsMatch = job.skills?.some(skill => 
        skill?.toLowerCase().includes(searchLower)
      );
      
      // 7. Salary range (search for numbers like "100000")
      const salaryMatch = job.salary?.toLowerCase().includes(searchLower);
      
      // Return true if matches any field
      return titleMatch || companyMatch || categoryMatch || locationMatch || typeMatch || skillsMatch || salaryMatch;
    });

    // Apply additional dropdown filters
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
                placeholder="Search: job title, company, skills, location, field, salary..."
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
            <div key={job._id} className="job-card" data-job-id={job._id}>
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
                </div>

                {/* Floating animated match badge (rendered outside meta-tags to float top-right) */}
                {typeof job.matchScore === 'number' && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <AnimatedMatch score={job.matchScore} />
                  </div>
                )}

                {/* Match breakdown - shown when user expands the badge */}
                {openBreakdownId === job._id && matchBreakdownByJob[job._id] && (
                  <div className="match-breakdown">
                    <div><strong>Match breakdown</strong></div>
                    <div>Profile: {matchBreakdownByJob[job._id].profile ?? matchBreakdownByJob[job._id].profileScore ?? '-'}</div>
                    <div>Skills: {matchBreakdownByJob[job._id].skills ?? matchBreakdownByJob[job._id].skillsScore ?? '-'}</div>
                    <div>Education: {matchBreakdownByJob[job._id].education ?? matchBreakdownByJob[job._id].educationScore ?? '-'}</div>
                    <div>Experience: {matchBreakdownByJob[job._id].experience ?? matchBreakdownByJob[job._id].experienceScore ?? '-'}</div>
                  </div>
                )}

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