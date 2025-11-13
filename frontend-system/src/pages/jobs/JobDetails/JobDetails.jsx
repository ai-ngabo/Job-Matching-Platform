import React from 'react';
import { MapPin, Building2, Clock, DollarSign, Users, Calendar } from 'lucide-react';
import './JobDetails.css';

const JobDetails = ({ job }) => {
  if (!job) {
    return (
      <div className="job-details-container">
        <div className="no-job-selected">
          <p>Select a job to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-container">
      <div className="job-details-card">
        <div className="job-header">
          <div className="job-title-section">
            <h1 className="job-main-title">{job.title}</h1>
            <div className="company-badge">
              <Building2 className="company-icon" />
              <span>{job.company}</span>
            </div>
          </div>
          
          <div className="match-score-large">
            <span className="match-score-text">{job.matchScore}% Match</span>
          </div>
        </div>

        <div className="job-meta-grid">
          <div className="meta-item">
            <MapPin className="meta-icon-large" />
            <div>
              <span className="meta-label">Location</span>
              <span className="meta-value">{job.location}</span>
            </div>
          </div>
          
          <div className="meta-item">
            <DollarSign className="meta-icon-large" />
            <div>
              <span className="meta-label">Salary</span>
              <span className="meta-value">{job.salary}</span>
            </div>
          </div>
          
          <div className="meta-item">
            <Clock className="meta-icon-large" />
            <div>
              <span className="meta-label">Job Type</span>
              <span className="meta-value">{job.type}</span>
            </div>
          </div>
          
          <div className="meta-item">
            <Users className="meta-icon-large" />
            <div>
              <span className="meta-label">Experience</span>
              <span className="meta-value">{job.experience} Level</span>
            </div>
          </div>
        </div>

        <div className="job-content">
          <section className="description-section">
            <h2 className="section-title">Job Description</h2>
            <p className="description-text">{job.description}</p>
          </section>

          <section className="requirements-section">
            <h2 className="section-title">Requirements</h2>
            <ul className="requirements-list">
              {job.requirements?.map((req, index) => (
                <li key={index} className="requirement-item">{req}</li>
              ))}
            </ul>
          </section>

          <section className="skills-section">
            <h2 className="section-title">Required Skills</h2>
            <div className="skills-container">
              {job.skills.map((skill, index) => (
                <span key={index} className="skill-pill">{skill}</span>
              ))}
            </div>
          </section>
        </div>

        <div className="job-actions">
          <button className="apply-button">Apply Now</button>
          <button className="save-button">Save Job</button>
          <button className="share-button">Share</button>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;