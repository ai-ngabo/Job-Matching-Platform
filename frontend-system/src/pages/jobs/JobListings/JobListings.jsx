import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Building2, Clock, DollarSign } from 'lucide-react';
import './JobListings.css';

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    jobType: '',
    experience: '',
    location: '',
    minSalary: ''
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote'];
  const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive'];

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockJobs = [
      {
        id: '1',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$90,000 - $120,000',
        type: 'Full-time',
        experience: 'Mid',
        postedDate: '2024-01-15',
        description: 'We are looking for a skilled Frontend Developer...',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
        matchScore: 95
      },
      {
        id: '2',
        title: 'Backend Engineer',
        company: 'DataSystems',
        location: 'Remote',
        salary: '$110,000 - $140,000',
        type: 'Full-time',
        experience: 'Senior',
        postedDate: '2024-01-14',
        description: 'Join our backend team to build scalable systems...',
        skills: ['Node.js', 'Python', 'AWS', 'MongoDB'],
        matchScore: 87
      }
    ];
    
    setJobs(mockJobs);
    setFilteredJobs(mockJobs);
  }, []);

  useEffect(() => {
    let result = jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filters.jobType) {
      result = result.filter(job => job.type === filters.jobType);
    }
    if (filters.experience) {
      result = result.filter(job => job.experience === filters.experience);
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
              value={filters.experience}
              onChange={(e) => setFilters({...filters, experience: e.target.value})}
            >
              <option value="">All Levels</option>
              {experienceLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="jobs-grid">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-card">
            <div className="job-card-header">
              <div className="job-title-section">
                <div className="job-title-wrapper">
                  <h3 className="job-title">{job.title}</h3>
                  <span className="match-score-badge">
                    {job.matchScore}% Match
                  </span>
                </div>
                
                <div className="job-meta-info">
                  <div className="job-meta-item">
                    <Building2 className="meta-icon" />
                    <span>{job.company}</span>
                  </div>
                  <div className="job-meta-item">
                    <MapPin className="meta-icon" />
                    <span>{job.location}</span>
                  </div>
                  <div className="job-meta-item">
                    <Clock className="meta-icon" />
                    <span>{job.type}</span>
                  </div>
                  <div className="job-meta-item">
                    <DollarSign className="meta-icon" />
                    <span>{job.salary}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="job-description">
              <p>{job.description}</p>
            </div>

            <div className="skills-section">
              <div className="skills-tags">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="job-card-actions">
              <button className="view-details-btn">
                View Details
              </button>
              <button className="save-job-btn">
                Save Job
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobListings;