import React, { useState, useCallback } from 'react';
import { Save, X, Edit2, ChevronDown } from 'lucide-react';
import { userService } from '../../services/userService';
import './ProfileEditor.css';

const ProfileEditor = ({ profileData, isCompany, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState(
    isCompany
      ? {
          companyName: profileData?.company?.name || '',
          companyDescription: profileData?.company?.description || '',
          website: profileData?.company?.website || '',
          industry: profileData?.company?.industry || '',
          companyPhone: profileData?.company?.contact?.phone || '',
          personName: profileData?.company?.contact?.personName || '',
          personPosition: profileData?.company?.contact?.personPosition || '',
          registrationNumber: profileData?.company?.businessRegistration?.registrationNumber || ''
        }
      : {
          firstName: profileData?.profile?.firstName || '',
          lastName: profileData?.profile?.lastName || '',
          phone: profileData?.profile?.phone || '',
          location: profileData?.profile?.location || '',
          bio: profileData?.profile?.bio || '',
          skills: (profileData?.profile?.skills || []).join(', '),
          experienceLevel: profileData?.profile?.experienceLevel || 'entry',
          educationLevel: profileData?.profile?.educationLevel || 'high-school'
        }
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = isCompany
        ? {
            companyName: formData.companyName,
            companyDescription: formData.companyDescription,
            website: formData.website,
            industry: formData.industry,
            companyPhone: formData.companyPhone,
            personName: formData.personName,
            personPosition: formData.personPosition,
            registrationNumber: formData.registrationNumber
          }
        : {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            location: formData.location,
            bio: formData.bio,
            skills: formData.skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            experienceLevel: formData.experienceLevel,
            educationLevel: formData.educationLevel
          };

      const response = await userService.updateProfile(payload);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      if (onSave) onSave(response.user);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [formData, isCompany, onSave]);

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setFormData(
      isCompany
        ? {
            companyName: profileData?.company?.name || '',
            companyDescription: profileData?.company?.description || '',
            website: profileData?.company?.website || '',
            industry: profileData?.company?.industry || '',
            companyPhone: profileData?.company?.contact?.phone || '',
            personName: profileData?.company?.contact?.personName || '',
            personPosition: profileData?.company?.contact?.personPosition || '',
            registrationNumber: profileData?.company?.businessRegistration?.registrationNumber || ''
          }
        : {
            firstName: profileData?.profile?.firstName || '',
            lastName: profileData?.profile?.lastName || '',
            phone: profileData?.profile?.phone || '',
            location: profileData?.profile?.location || '',
            bio: profileData?.profile?.bio || '',
            skills: (profileData?.profile?.skills || []).join(', '),
            experienceLevel: profileData?.profile?.experienceLevel || 'entry',
            educationLevel: profileData?.profile?.educationLevel || 'high-school'
          }
    );
  };

  if (!isEditing) {
    return (
      <button
        className="edit-profile-btn"
        onClick={() => setIsEditing(true)}
        aria-label="Edit profile"
      >
        <Edit2 size={16} />
        Edit Profile
      </button>
    );
  }

  return (
    <div className="profile-editor-modal">
      <div className="editor-overlay" onClick={handleCancel} />
      <div className="editor-container">
        <div className="editor-header">
          <h2>{isCompany ? 'Edit Company Profile' : 'Edit Your Profile'}</h2>
          <button
            className="close-btn"
            onClick={handleCancel}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && <div className="editor-error">{error}</div>}
        {success && <div className="editor-success">{success}</div>}

        <form className="editor-form">
          {isCompany ? (
            <>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  placeholder="Tell us about your company, mission, and culture"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Finance"
                  />
                </div>
              </div>

              <div className="form-divider">Contact Information</div>

              <div className="form-group">
                <label>Primary Contact Name</label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Position</label>
                  <input
                    type="text"
                    name="personPosition"
                    value={formData.personPosition}
                    onChange={handleInputChange}
                    placeholder="e.g., HR Manager"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="Business registration number"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell employers about yourself, your passions, and career goals"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., JavaScript, React, Python, Project Management"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Education Level</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                  >
                    <option value="high-school">High School</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelors">Bachelor's Degree</option>
                    <option value="masters">Master's Degree</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </form>

        <div className="editor-footer">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            <X size={16} />
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
