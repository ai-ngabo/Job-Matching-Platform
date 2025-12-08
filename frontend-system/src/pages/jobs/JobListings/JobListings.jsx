import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, DollarSign, AlertCircle, Bookmark, BookmarkCheck, Calendar, Briefcase, Clock, GraduationCap, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

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
  });

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  const categories = ['technology', 'business', 'healthcare', 'education', 'engineering', 'design', 'marketing', 'sales', 'customer-service'];

  // Fetch jobs and saved jobs
  useEffect(() => {
    const init = async () => {
      await fetchJobs();
      // Load saved jobs from localStorage
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobs(saved);
    };

    init();
  }, []);

  // Format salary with RWF currency
  const formatSalary = (salaryRange) => {
    if (!salaryRange || !salaryRange.min || !salaryRange.max) return 'Salary not specified';
    const { min, max, currency = 'RWF' } = salaryRange;
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  // Format date to "X days ago"
  const formatDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Format experience level
  const formatExperienceLevel = (level) => {
    const levels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    };
    return levels[level] || level;
  };

  // Format education level
  const formatEducationLevel = (level) => {
    const levels = {
      'high-school': 'High School',
      'associate': 'Associate Degree',
      'bachelors': "Bachelor's Degree",
      'masters': "Master's Degree",
      'phd': 'PhD'
    };
    return levels[level] || level;
  };

  // Format job type
  const formatJobType = (type) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
        salary: formatSalary(job.salaryRange),
        salaryRange: job.salaryRange,
        type: job.jobType || 'full-time',
        formattedType: formatJobType(job.jobType || 'full-time'),
        category: job.category || 'other',
        experienceLevel: formatExperienceLevel(job.experienceLevel || 'mid'),
        educationLevel: formatEducationLevel(job.educationLevel || 'Not specified'),
        postedDate: formatDaysAgo(job.createdAt),
        fullDate: new Date(job.createdAt).toLocaleDateString(),
        description: job.description || '',
        requirements: job.requirements || [],
        skills: job.skillsRequired || [],
        views: job.views || 0,
        applications: job.applicationCount || 0,
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline',
        daysUntilDeadline: job.applicationDeadline ? 
          Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
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
  const toggleSaveJob = (jobId, e) => {
    if (e) e.stopPropagation();
    
    let updated = [...savedJobs];
    if (updated.includes(jobId)) {
      updated = updated.filter(id => id !== jobId);
    } else {
      updated.push(jobId);
    }
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  // View job details
  const viewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Filter jobs based on search and filters
  useEffect(() => {
    let result = jobs.filter(job => {
      // Search across multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.category.toLowerCase().includes(searchLower);

      const matchesType = !filters.jobType || job.type === filters.jobType;
      const matchesCategory = !filters.category || job.category === filters.category;
      const matchesLocation = !filters.location || 
        job.location.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSearch && matchesType && matchesCategory && matchesLocation;
    });

    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  // Container Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    minHeight: 'calc(100vh - 100px)',
    backgroundColor: '#f8fafc',
  };

  // Search Section Styles
  const searchSectionStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const searchFlexStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const searchInputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    background: 'transparent',
    color: '#1e293b',
    fontWeight: '500',
  };

  const filtersContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  };

  const filterSelectStyle = {
    flex: 1,
    minWidth: '120px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    fontSize: '0.85rem',
    background: 'white',
    color: '#475569',
    fontWeight: '500',
    cursor: 'pointer',
  };

  // Jobs Grid Styles
  const jobsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  // Job Card Styles - VERY TALL to show ALL info
  const jobCardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    height: '750px', // VERY TALL to show ALL content without scrolling
    minHeight: '750px',
  };

  const cardHeaderStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: '100px',
  };

  const logoWrapperStyle = {
    width: '70px',
    height: '70px',
    background: 'white',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid white',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  };

  const saveBtnStyle = (isSaved) => ({
    background: isSaved ? '#fbbf24' : 'white',
    border: 'none',
    color: isSaved ? 'white' : '#0073e6',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    minHeight: '40px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  });

  const cardBodyStyle = {
    padding: '1.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflow: 'visible',
  };

  const jobTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    lineHeight: '1.3',
    marginBottom: '0.25rem',
  };

  const companyNameStyle = {
    color: '#6b7280',
    fontSize: '1rem',
    margin: 0,
    fontWeight: '500',
    marginBottom: '0.75rem',
  };

  // Job Info Grid - Shows ALL basic info
  const jobInfoRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  const jobInfoItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#6b7280',
    background: '#f8fafc',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  };

  // Salary and Type
  const salaryTypeRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '0.75rem 0',
    padding: '1rem',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
    borderRadius: '10px',
    border: '1px solid #e0f2fe',
  };

  const salaryDisplayStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f766e',
  };

  const jobTypeTagStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    boxShadow: '0 2px 6px rgba(0, 115, 230, 0.2)',
  };

  // Description - FULL height
  const descriptionSectionStyle = {
    margin: '0.75rem 0',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e5e7eb',
  };

  const descriptionLabelStyle = {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const jobDescriptionStyle = {
    fontSize: '0.85rem',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    maxHeight: '120px',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  };

  // Skills Section - FULL height
  const skillsSectionStyle = {
    margin: '0.75rem 0',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e5e7eb',
  };

  const skillsLabelStyle = {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const skillsTagsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    maxHeight: '80px',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  };

  const skillTagStyle = {
    background: '#eff6ff',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '500',
    border: '1px solid #dbeafe',
  };

  // Dates Row
  const datesRowStyle = {
    margin: '0.75rem 0',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const dateItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    color: '#6b7280',
  };

  const deadlineBadgeStyle = {
    marginLeft: 'auto',
    background: '#fef3c7',
    color: '#92400e',
    padding: '0.25rem 0.75rem',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: '600',
  };

  // Card Footer
  const cardFooterStyle = {
    padding: '1.25rem 1.5rem',
    background: '#f8fafc',
    borderTop: '1px solid #e5e7eb',
  };

  const jobStatsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const statItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const statLabelStyle = {
    fontSize: '0.85rem',
    color: '#6b7280',
  };

  const statValueStyle = {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e293b',
  };

  const cardActionsStyle = {
    display: 'flex',
    gap: '1rem',
  };

  const actionBtnStyle = (type) => ({
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    fontSize: '0.85rem',
    border: 'none',
    whiteSpace: 'nowrap',
    background: type === 'view' ? 'white' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: type === 'view' ? '#0073e6' : 'white',
    border: type === 'view' ? '2px solid #0073e6' : 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  });

  const resultsCountStyle = {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.9rem',
    padding: '1rem',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontWeight: '500',
  };

  const loadingStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  };

  const spinnerStyle = {
    width: '2.5rem',
    height: '2.5rem',
    border: '2px solid #f3f4f6',
    borderTopColor: '#0073e6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '1rem',
  };

  const errorStateStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '1.5rem',
    fontWeight: '500',
    fontSize: '0.9rem',
  };

  const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    background: 'white',
    borderRadius: '12px',
    border: '2px dashed #d1d5db',
    textAlign: 'center',
  };

  // Add spin animation and scrollbar styling
  const styleTag = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;

  return (
    <div style={containerStyle}>
      {/* Add animation styles */}
      <style>{styleTag}</style>
      
      {/* Search and Filters */}
      <div style={searchSectionStyle}>
        <div style={searchFlexStyle}>
          <div style={{ flex: 1 }}>
            <div style={searchInputWrapperStyle}>
              <Search style={{
                position: 'absolute',
                left: '0.75rem',
                color: '#94a3b8',
                height: '1rem',
                width: '1rem',
              }} />
              <input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                style={searchInputStyle}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div style={filtersContainerStyle}>
            <select
              style={filterSelectStyle}
              value={filters.jobType}
              onChange={(e) => setFilters({...filters, jobType: e.target.value})}
            >
              <option value="">All Types</option>
              {jobTypes.map(type => (
                <option key={type} value={type}>{formatJobType(type)}</option>
              ))}
            </select>
            
            <select
              style={filterSelectStyle}
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>

            <input
              type="text"
              style={filterSelectStyle}
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={loadingStateStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Loading jobs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={errorStateStyle}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button 
            onClick={fetchJobs} 
            style={{
              marginLeft: 'auto',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      <div>
        {!loading && !error && filteredJobs.length > 0 ? (
          <>
            {/* Jobs Grid - 3 CARDS PER ROW */}
            <div style={jobsGridStyle}>
              {filteredJobs.map(job => (
                <div 
                  key={job._id} 
                  style={jobCardStyle}
                  onClick={() => viewJobDetails(job._id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Card Header */}
                  <div style={cardHeaderStyle}>
                    <div style={logoWrapperStyle}>
                      {job.companyLogo ? (
                        <img 
                          src={job.companyLogo} 
                          alt={job.company} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                        />
                      ) : (
                        <Building2 size={40} style={{ color: '#cbd5e1' }} />
                      )}
                    </div>
                    <button 
                      style={saveBtnStyle(savedJobs.includes(job._id))}
                      onClick={(e) => toggleSaveJob(job._id, e)}
                      title={savedJobs.includes(job._id) ? 'Remove from saved' : 'Save job'}
                    >
                      {savedJobs.includes(job._id) ? (
                        <BookmarkCheck size={20} />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>
                  </div>

                  {/* Card Body - ALL CONTENT VISIBLE */}
                  <div style={cardBodyStyle}>
                    <h3 style={jobTitleStyle}>{job.title}</h3>
                    <p style={companyNameStyle}>{job.company}</p>
                    
                    {/* Job Info Grid - Shows ALL basic info */}
                    <div style={jobInfoRowStyle}>
                      <div style={jobInfoItemStyle}>
                        <MapPin size={14} />
                        <span>{job.location}</span>
                      </div>
                      <div style={jobInfoItemStyle}>
                        <Briefcase size={14} />
                        <span>{job.experienceLevel}</span>
                      </div>
                      <div style={jobInfoItemStyle}>
                        <GraduationCap size={14} />
                        <span>{job.educationLevel}</span>
                      </div>
                      <div style={jobInfoItemStyle}>
                        <Target size={14} />
                        <span style={{ textTransform: 'capitalize' }}>{job.category}</span>
                      </div>
                    </div>

                    {/* Salary and Type */}
                    <div style={salaryTypeRowStyle}>
                      <div style={salaryDisplayStyle}>
                        <DollarSign size={16} />
                        <strong>{job.salary}</strong>
                      </div>
                      <span style={jobTypeTagStyle}>{job.formattedType}</span>
                    </div>

                    {/* Dates Row */}
                    <div style={datesRowStyle}>
                      <div style={dateItemStyle}>
                        <Calendar size={14} />
                        <span><strong>Application Deadline:</strong> {job.applicationDeadline}</span>
                        {job.daysUntilDeadline !== null && job.daysUntilDeadline > 0 && (
                          <span style={deadlineBadgeStyle}>{job.daysUntilDeadline} days left</span>
                        )}
                      </div>
                      <div style={dateItemStyle}>
                        <Clock size={14} />
                        <span><strong>Posted:</strong> {job.postedDate} ({job.fullDate})</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={cardFooterStyle}>
                    <div style={jobStatsStyle}>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Views:</span>
                        <span style={statValueStyle}>{job.views}</span>
                      </div>
                      <div style={statItemStyle}>
                        <span style={statLabelStyle}>Applications:</span>
                        <span style={statValueStyle}>{job.applications}</span>
                      </div>
                    </div>
                    
                    <div style={cardActionsStyle}>
                      <button 
                        style={actionBtnStyle('view')}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewJobDetails(job._id);
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        style={actionBtnStyle('apply')}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewJobDetails(job._id);
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </>
        ) : !loading && !error ? (
          // Empty state when no jobs found
          <div style={emptyStateStyle}>
            <Building2 size={40} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.2rem', fontWeight: '600' }}>
              No jobs found
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '300px' }}>
              Try adjusting your search or filters
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilters({ jobType: '', category: '', location: '' });
              }} 
              style={{
                background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default JobListings;