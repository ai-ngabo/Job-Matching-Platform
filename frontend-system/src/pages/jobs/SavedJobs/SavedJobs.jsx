import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  Calendar,
  GraduationCap,
  Target,
  Eye,
  Users
} from 'lucide-react';

const SavedJobs = () => {
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
    
    return () => window.removeEventListener('storage', handleStorageChange);
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
      const validJobs = jobsData
        .map(response => {
          if (!response) return null;
          // API returns { job: {...}, message: '...' }
          const jobData = response.job || response;
          return jobData;
        })
        .filter(job => job && job._id && job.title)
        .map(job => ({
          ...job,
          formattedType: formatJobType(job.jobType || 'full-time'),
          formattedExperience: formatExperienceLevel(job.experienceLevel || 'mid'),
          formattedEducation: formatEducationLevel(job.educationLevel || 'Not specified'),
          formattedSalary: formatSalary(job.salaryRange),
          postedDate: formatDaysAgo(job.createdAt),
          fullDate: new Date(job.createdAt).toLocaleDateString(),
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline',
          daysUntilDeadline: job.applicationDeadline ? 
            Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        }));

      console.log('✅ Valid jobs after processing:', validJobs);
      
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
    (job?.companyName?.toLowerCase() || job?.company?.company?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job?.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job?.skillsRequired?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) || false)
  );

  // Container Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    minHeight: 'calc(100vh - 100px)',
    backgroundColor: '#f8fafc',
  };

  // Header Styles
  const headerStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '1.5rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 115, 230, 0.2)',
  };

  const headerContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const headerStatsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '0.75rem 1.5rem',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
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

  // Jobs Grid Styles
  const jobsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  // Job Card Styles
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
    height: '750px',
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

  const removeBtnStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    minHeight: '40px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
  };

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

  // Loading State Styles
  const loadingStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  };

  const spinnerStyle = {
    width: '3rem',
    height: '3rem',
    border: '3px solid #f3f4f6',
    borderTopColor: '#0073e6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '1.5rem',
  };

  // Error State Styles
  const errorStateStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    color: '#dc2626',
    marginBottom: '1.5rem',
    fontWeight: '500',
  };

  // Empty State Styles
  const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
    background: 'white',
    borderRadius: '12px',
    border: '2px dashed #d1d5db',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  // Results Count Styles
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

  if (loading) {
    return (
      <div style={containerStyle}>
        <style>{styleTag}</style>
        <div style={loadingStateStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem', fontWeight: '500' }}>
            Loading your saved jobs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Add animation styles */}
      <style>{styleTag}</style>
      
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <BookmarkCheck size={40} style={{ color: 'white' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
              Saved Jobs
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
              Your collection of jobs you're interested in
            </p>
          </div>
        </div>
        <div style={headerStatsStyle}>
          <Bookmark size={24} style={{ color: 'white' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            {jobs.length} Saved
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={errorStateStyle}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={loadSavedJobs} 
            style={{
              marginLeft: 'auto',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Section */}
      {jobs.length > 0 && (
        <div style={searchSectionStyle}>
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
              placeholder="Search saved jobs by title, company, location, or skills..."
              style={searchInputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
              Found {filteredJobs.length} of {jobs.length} saved jobs
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 ? (
        <div style={emptyStateStyle}>
          <BookmarkCheck size={64} style={{ color: '#9ca3af', marginBottom: '1.5rem' }} />
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#111827', fontSize: '1.5rem', fontWeight: '600' }}>
            No Saved Jobs Yet
          </h3>
          <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '400px' }}>
            Browse job listings and save your favorite opportunities
          </p>
          <button 
            onClick={() => navigate('/jobs')}
            style={{
              background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 115, 230, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        /* Jobs Grid */
        <>
          <div style={jobsGridStyle}>
            {filteredJobs.map((job) => (
              <div 
                key={job._id} 
                style={jobCardStyle}
                onClick={() => viewJobDetails(job._id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.querySelector('.remove-btn').style.background = '#dc2626';
                  e.currentTarget.querySelector('.remove-btn').style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.querySelector('.remove-btn').style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.querySelector('.remove-btn').style.color = '#dc2626';
                }}
              >
                {/* Card Header */}
                <div style={cardHeaderStyle}>
                  <div style={logoWrapperStyle}>
                    {job.company?.company?.logo ? (
                      <img 
                        src={job.company?.company?.logo} 
                        alt={job.company?.company?.name || job.companyName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                      />
                    ) : (
                      <Building2 size={40} style={{ color: '#cbd5e1' }} />
                    )}
                  </div>
                  <button 
                    className="remove-btn"
                    style={removeBtnStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSavedJob(job._id);
                    }}
                    title="Remove from saved"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Card Body */}
                <div style={cardBodyStyle}>
                  <h3 style={jobTitleStyle}>{job.title}</h3>
                  <p style={companyNameStyle}>{job.companyName || job.company?.company?.name || 'Company'}</p>
                  
                  {/* Job Info Grid */}
                  <div style={jobInfoRowStyle}>
                    <div style={jobInfoItemStyle}>
                      <MapPin size={14} />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    <div style={jobInfoItemStyle}>
                      <Briefcase size={14} />
                      <span>{job.formattedExperience}</span>
                    </div>
                    <div style={jobInfoItemStyle}>
                      <GraduationCap size={14} />
                      <span>{job.formattedEducation}</span>
                    </div>
                    <div style={jobInfoItemStyle}>
                      <Target size={14} />
                      <span style={{ textTransform: 'capitalize' }}>{job.category || 'General'}</span>
                    </div>
                  </div>

                  {/* Salary and Type */}
                  <div style={salaryTypeRowStyle}>
                    <div style={salaryDisplayStyle}>
                      <DollarSign size={16} />
                      <strong>{job.formattedSalary}</strong>
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
                      <Eye size={16} />
                      <span style={statLabelStyle}>Views:</span>
                      <span style={statValueStyle}>{job.views || 0}</span>
                    </div>
                    <div style={statItemStyle}>
                      <Users size={16} />
                      <span style={statLabelStyle}>Applications:</span>
                      <span style={statValueStyle}>{job.applicationCount || 0}</span>
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
      )}
    </div>
  );
};

export default SavedJobs;