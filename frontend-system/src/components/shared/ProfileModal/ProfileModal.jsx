import React, { useState, useEffect } from 'react';
import { X, Download, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ applicant, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!applicant) return null;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || 'S'}`.toUpperCase();
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    const apiBase = typeof window !== 'undefined' 
      ? (window.__ENV__?.VITE_API_BASE_URL || 'http://localhost:5000')
      : 'http://localhost:5000';
    return `${apiBase}${profilePicture}`;
  };

  const profilePicture = getProfilePictureUrl(applicant.profile?.profilePicture);
  const initials = getInitials(applicant.profile?.firstName, applicant.profile?.lastName);

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <h2>Candidate Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Profile Header */}
        <div className="profile-header-section">
          <div className="profile-picture">
            {profilePicture ? (
              <img src={profilePicture} alt={`${applicant.profile?.firstName} ${applicant.profile?.lastName}`} />
            ) : (
              <div className="profile-initials">{initials}</div>
            )}
          </div>
          <div className="profile-info">
            <h1>{applicant.profile?.firstName} {applicant.profile?.lastName}</h1>
            <p className="profile-title">{applicant.profile?.headline || 'Job Seeker'}</p>
            <div className="profile-meta">
              <span className="meta-item">
                <Mail size={16} /> {applicant.email}
              </span>
              {applicant.profile?.phone && (
                <span className="meta-item">
                  <Phone size={16} /> {applicant.profile.phone}
                </span>
              )}
              {applicant.profile?.location && (
                <span className="meta-item">
                  <MapPin size={16} /> {applicant.profile.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            Experience
          </button>
          <button
            className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
          <button
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              {applicant.profile?.summary && (
                <div className="content-section">
                  <h3>Summary</h3>
                  <p>{applicant.profile.summary}</p>
                </div>
              )}

              <div className="content-section">
                <h3>About</h3>
                <div className="about-grid">
                  {applicant.profile?.headline && (
                    <div className="about-item">
                      <span className="label">Headline:</span>
                      <span>{applicant.profile.headline}</span>
                    </div>
                  )}
                  {applicant.profile?.industry && (
                    <div className="about-item">
                      <span className="label">Industry:</span>
                      <span>{applicant.profile.industry}</span>
                    </div>
                  )}
                  {applicant.profile?.jobPreference && (
                    <div className="about-item">
                      <span className="label">Job Type:</span>
                      <span>{applicant.profile.jobPreference}</span>
                    </div>
                  )}
                  {applicant.profile?.salaryExpectation && (
                    <div className="about-item">
                      <span className="label">Salary Expectation:</span>
                      <span>${applicant.profile.salaryExpectation?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="tab-content">
              {applicant.profile?.experience && applicant.profile.experience.length > 0 ? (
                <div className="content-section">
                  {applicant.profile.experience.map((exp, index) => (
                    <div key={index} className="experience-item">
                      <div className="exp-header">
                        <h4>{exp.jobTitle}</h4>
                        <span className="exp-date">
                          {new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          {' - '}
                          {exp.endDate 
                            ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                            : 'Present'
                          }
                        </span>
                      </div>
                      <p className="exp-company">{exp.company}</p>
                      {exp.description && <p className="exp-description">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No experience information provided</p>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="tab-content">
              {applicant.profile?.education && applicant.profile.education.length > 0 ? (
                <div className="content-section">
                  {applicant.profile.education.map((edu, index) => (
                    <div key={index} className="education-item">
                      <div className="edu-header">
                        <h4>{edu.degree}</h4>
                        {edu.graduationDate && (
                          <span className="edu-date">
                            {new Date(edu.graduationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="edu-school">{edu.school}</p>
                      {edu.field && <p className="edu-field">Field: {edu.field}</p>}
                      {edu.description && <p className="edu-description">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No education information provided</p>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="tab-content">
              {applicant.profile?.skills && applicant.profile.skills.length > 0 ? (
                <div className="content-section">
                  <div className="skills-grid">
                    {applicant.profile.skills.map((skill, index) => (
                      <div key={index} className="skill-badge">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="empty-state">No skills provided</p>
              )}
            </div>
          )}
        </div>

        {/* Footer with CV Download */}
        {applicant.profile?.documents?.cv?.url && (
          <div className="profile-footer">
            <a 
              href={applicant.profile.documents.cv.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="download-cv-btn"
            >
              <Download size={18} /> Download CV
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
