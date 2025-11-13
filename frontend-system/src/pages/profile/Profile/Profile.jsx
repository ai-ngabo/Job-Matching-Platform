import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Building2,
  Globe,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/userService';
import './Profile.css';

const capitalize = (value = '') =>
  value
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const AvatarUploader = ({ currentAvatar, uploading, onSelect, label }) => {
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (files) => {
      if (!files || !files.length || uploading) return;
      onSelect?.(files[0]);
    },
    [onSelect, uploading]
  );

  const handleInputChange = (event) => {
    handleFiles(event.target.files);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploading) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleClick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  return (
    <div
      className={`avatar-uploader ${uploading ? 'is-uploading' : ''}`}
      onClick={handleClick}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={handleDrop}
      role="presentation"
    >
      {currentAvatar ? (
        <img src={currentAvatar} alt={label} className="avatar-image" />
      ) : (
        <div className="avatar-placeholder">
          <UploadCloud size={28} />
          <span>{label}</span>
        </div>
      )}
      <div className="avatar-overlay">
        {uploading ? 'Uploading photo...' : 'Click or drag a photo to update'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="avatar-input"
        onChange={handleInputChange}
      />
    </div>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await userService.getProfile();
        if (!mounted) return;
        setProfileData(response.user);
        if (typeof updateUser === 'function') {
          updateUser(response.user);
        }
      } catch (err) {
        if (!mounted) return;
        const message = err.response?.data?.message || 'Unable to load profile information.';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAvatarSelect = useCallback(
    async (file) => {
      if (!file || uploadingAvatar) return;

      if (!file.type.startsWith('image/')) {
        setUploadError('Please choose an image file (JPEG or PNG).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image is too large. Please choose a file under 5MB.');
        return;
      }

      setUploadError('');
      setUploadingAvatar(true);
      try {
        const response = await userService.uploadAvatar(file);
        setProfileData(response.user);
        updateUser(response.user);
      } catch (err) {
        const message = err.response?.data?.message || 'Could not upload photo. Please try again.';
        setUploadError(message);
      } finally {
        setUploadingAvatar(false);
      }
    },
    [updateUser, uploadingAvatar]
  );

  const isJobSeeker = profileData?.userType === 'jobseeker';
  const isCompany = profileData?.userType === 'company';

  const personal = profileData?.profile || {};
  const company = profileData?.company || {};

  const displayName = isJobSeeker
    ? [personal.firstName, personal.lastName].filter(Boolean).join(' ').trim()
    : company.name;

  const summaryDescription = isJobSeeker ? personal.bio : company.description;
  const currentAvatar = isCompany ? company.logo : personal.avatar;

  const experienceLabel = personal.experienceLevel ? capitalize(personal.experienceLevel) : '';
  const educationLabel = personal.educationLevel ? capitalize(personal.educationLevel) : '';
  const approvalLabel = profileData?.approvalStatus ? capitalize(profileData.approvalStatus) : '';

  const skills = useMemo(() => {
    const rawSkills = personal.skills;
    if (!rawSkills) return [];
    if (Array.isArray(rawSkills)) {
      return rawSkills.filter(Boolean);
    }
    return rawSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [personal.skills]);

  const contactPhone = isCompany ? company.contact?.phone : personal.phone;
  const contactEmail = isCompany ? company.contact?.email || profileData?.email : profileData?.email;
  const contactLocation = isJobSeeker ? personal.location : '';
  const website = company.website;

  const avatarLabel = isCompany ? 'Upload company logo' : 'Upload profile photo';

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
        </div>
        <div className="profile-loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
      </div>

      {error && <div className="profile-error">{error}</div>}

      <div className="profile-hero">
        <AvatarUploader
          currentAvatar={currentAvatar}
          uploading={uploadingAvatar}
          onSelect={handleAvatarSelect}
          label={avatarLabel}
        />

        <div className="profile-summary">
          <h2>{displayName || (isCompany ? 'Add your company name' : 'Add your full name')}</h2>
          {summaryDescription ? (
            <p>{summaryDescription}</p>
          ) : (
            <p className="summary-placeholder">
              {isCompany
                ? 'Share a short description to help talent learn more about your mission.'
                : 'Tell employers about your background, passions, and career goals.'}
            </p>
          )}

          <div className="summary-meta">
            {isJobSeeker && personal.location && (
              <span className="summary-meta-item">
                <MapPin size={16} />
                {personal.location}
              </span>
            )}
            {isJobSeeker && experienceLabel && (
              <span className="summary-meta-item">
                <Briefcase size={16} />
                {experienceLabel} Level
              </span>
            )}
            {isJobSeeker && educationLabel && (
              <span className="summary-meta-item">
                <GraduationCap size={16} />
                {educationLabel}
              </span>
            )}
            {isCompany && company.industry && (
              <span className="summary-meta-item">
                <Building2 size={16} />
                {company.industry}
              </span>
            )}
            {isCompany && approvalLabel && (
              <span className={`summary-meta-item status-${profileData?.approvalStatus}`}>
                <ShieldCheck size={16} />
                {approvalLabel}
              </span>
            )}
          </div>

          {uploadError && <p className="upload-error">{uploadError}</p>}
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h3 className="profile-section-title">Contact Information</h3>
          <div className="info-list">
            {contactEmail && (
              <div className="info-row">
                <Mail className="info-icon" />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-value">{contactEmail}</span>
                </div>
              </div>
            )}

            {contactPhone && (
              <div className="info-row">
                <Phone className="info-icon" />
                <div>
                  <span className="info-label">Phone</span>
                  <span className="info-value">{contactPhone}</span>
                </div>
              </div>
            )}

            {contactLocation && (
              <div className="info-row">
                <MapPin className="info-icon" />
                <div>
                  <span className="info-label">Location</span>
                  <span className="info-value">{contactLocation}</span>
                </div>
              </div>
            )}

            {website && (
              <div className="info-row">
                <Globe className="info-icon" />
                <div>
                  <span className="info-label">Website</span>
                  <span className="info-value">
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      {website}
                    </a>
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {isJobSeeker ? (
          <section className="profile-card">
            <h3 className="profile-section-title">Career Snapshot</h3>
            <div className="info-list">
              <div className="info-row">
                <Briefcase className="info-icon" />
                <div>
                  <span className="info-label">Experience Level</span>
                  <span className="info-value">{experienceLabel || 'Not specified yet'}</span>
                </div>
              </div>
              <div className="info-row">
                <GraduationCap className="info-icon" />
                <div>
                  <span className="info-label">Education Level</span>
                  <span className="info-value">{educationLabel || 'Not specified yet'}</span>
                </div>
              </div>
              <div>
                <span className="info-label">Skills</span>
                {skills.length > 0 ? (
                  <div className="skills-list">
                    {skills.map((skill) => (
                      <span key={skill} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="profile-empty">Add the skills you want employers to see.</p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="profile-card">
            <h3 className="profile-section-title">Company Details</h3>
            <div className="info-list">
              <div>
                <span className="info-label">About</span>
                <p className="info-value">
                  {company.description || 'Share your company mission, vision, and team culture.'}
                </p>
              </div>
              <div className="info-row">
                <Building2 className="info-icon" />
                <div>
                  <span className="info-label">Industry</span>
                  <span className="info-value">{company.industry || 'Not specified yet'}</span>
                </div>
              </div>
              <div className="info-row">
                <Mail className="info-icon" />
                <div>
                  <span className="info-label">Primary Contact</span>
                  <span className="info-value">
                    {company.contact?.email || profileData?.email || 'Add a contact email'}
                  </span>
                </div>
              </div>
              {company.contact?.phone && (
                <div className="info-row">
                  <Phone className="info-icon" />
                  <div>
                    <span className="info-label">Contact Phone</span>
                    <span className="info-value">{company.contact.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Profile;