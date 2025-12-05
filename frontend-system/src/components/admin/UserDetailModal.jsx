import React from 'react';
import { X, Mail, Phone, MapPin, Building2, FileText, Calendar, Award, Link as LinkIcon, GitBranch } from 'lucide-react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, userType, onClose }) => {
  if (!user) return null;

  const isJobSeeker = userType === 'jobseeker';
  const profile = user.profile || {};
  const company = user.company || {};

  return (
    <div className="user-detail-modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {isJobSeeker ? (
            <>
              {/* Job Seeker Details */}
              <div className="section">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>First Name</label>
                    <p>{profile.firstName || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Last Name</label>
                    <p>{profile.lastName || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={16} />
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={16} />
                      <p>{profile.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} />
                      <p>{profile.location || '-'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Registered</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} />
                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="section">
                <h3>Professional Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Bio</label>
                    <p>{profile.bio || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Experience Level</label>
                    <p>{profile.experienceLevel ? profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1) : '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Education Level</label>
                    <p>{profile.educationLevel ? profile.educationLevel.charAt(0).toUpperCase() + profile.educationLevel.slice(1) : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="section">
                  <h3>Skills ({profile.skills.length})</h3>
                  <div className="skills-list">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {profile.experience && profile.experience.length > 0 && (
                <div className="section">
                  <h3>Experience ({profile.experience.length})</h3>
                  <div className="experience-list">
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} className="experience-item">
                        <div className="exp-header">
                          <h4>{exp.jobTitle}</h4>
                          <span className="exp-company">{exp.company}</span>
                        </div>
                        <p className="exp-period">
                          {new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                        </p>
                        {exp.description && <p className="exp-description">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <div className="section">
                  <h3>Education ({profile.education.length})</h3>
                  <div className="education-list">
                    {profile.education.map((edu, idx) => (
                      <div key={idx} className="education-item">
                        <div className="edu-header">
                          <h4>{edu.degree}</h4>
                          <span className="edu-field">{edu.fieldOfStudy}</span>
                        </div>
                        <p className="edu-institution">
                          <Award size={14} /> {edu.institution}
                        </p>
                        {edu.graduationYear && <p className="edu-year">{edu.graduationYear}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="section">
                  <h3>Certifications ({profile.certifications.length})</h3>
                  <div className="certifications-list">
                    {profile.certifications.map((cert, idx) => (
                      <div key={idx} className="certification-item">
                        <p><strong>{cert.name}</strong></p>
                        {cert.issuer && <p>Issued by: {cert.issuer}</p>}
                        {cert.issuedDate && <p>{new Date(cert.issuedDate).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {profile.projects && profile.projects.length > 0 && (
                <div className="section">
                  <h3>Projects ({profile.projects.length})</h3>
                  <div className="projects-list">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="project-item">
                        <div className="proj-header">
                          <h4>{proj.title}</h4>
                        </div>
                        {proj.description && <p>{proj.description}</p>}
                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer"><LinkIcon size={14} /> View Project</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.linkedin || profile.github) && (
                <div className="section">
                  <h3>Social Links</h3>
                  <div className="social-links">
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                        LinkedIn
                      </a>
                    )}
                    {profile.github && (
                      <a href={profile.github} target="_blank" rel="noopener noreferrer" className="social-link">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              {profile.documents && (Object.keys(profile.documents).length > 0) && (
                <div className="section">
                  <h3>Documents</h3>
                  <div className="documents-list">
                    {profile.documents.cv && profile.documents.cv.url && (
                      <a href={profile.documents.cv.url} target="_blank" rel="noopener noreferrer" className="document-link">
                        <FileText size={16} /> CV/Resume
                      </a>
                    )}
                    {profile.documents.coverLetter && profile.documents.coverLetter.url && (
                      <a href={profile.documents.coverLetter.url} target="_blank" rel="noopener noreferrer" className="document-link">
                        <FileText size={16} /> Cover Letter
                      </a>
                    )}
                    {profile.documents.idDocument && profile.documents.idDocument.url && (
                      <a href={profile.documents.idDocument.url} target="_blank" rel="noopener noreferrer" className="document-link">
                        <FileText size={16} /> ID Document
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Company Details */}
              <div className="section">
                <h3>Company Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Company Name</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} />
                      <p>{company.name || '-'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={16} />
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Industry</label>
                    <p>{company.industry || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Registered</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} />
                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Approval Status</label>
                    <p>
                      <span className={`status-badge status-${user.approvalStatus}`}>
                        {user.approvalStatus || 'pending'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              {company.description && (
                <div className="section">
                  <h3>About Company</h3>
                  <p>{company.description}</p>
                </div>
              )}

              {/* Contact Information */}
              {company.contact && (
                <div className="section">
                  <h3>Contact Information</h3>
                  <div className="info-grid">
                    {company.contact.email && (
                      <div className="info-item">
                        <label>Contact Email</label>
                        <p>{company.contact.email}</p>
                      </div>
                    )}
                    {company.contact.phone && (
                      <div className="info-item">
                        <label>Contact Phone</label>
                        <p>{company.contact.phone}</p>
                      </div>
                    )}
                    {company.contact.address && (
                      <div className="info-item">
                        <label>Address</label>
                        <p>{company.contact.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Website */}
              {company.website && (
                <div className="section">
                  <h3>Website</h3>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="website-link">
                    {company.website}
                  </a>
                </div>
              )}

              {/* Documents */}
              {company.documents && (Object.keys(company.documents).length > 0) && (
                <div className="section">
                  <h3>Business Documents</h3>
                  <div className="documents-list">
                    {company.documents.registrationCertificate && company.documents.registrationCertificate.url && (
                      <a href={company.documents.registrationCertificate.url} target="_blank" rel="noopener noreferrer" className="document-link">
                        <FileText size={16} /> Registration Certificate
                      </a>
                    )}
                    {company.documents.taxCertificate && company.documents.taxCertificate.url && (
                      <a href={company.documents.taxCertificate.url} target="_blank" rel="noopener noreferrer" className="document-link">
                        <FileText size={16} /> Tax Certificate
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
