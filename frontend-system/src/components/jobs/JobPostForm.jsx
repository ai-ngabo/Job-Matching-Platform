import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import './JobPostForm.css';

const JobPostForm = ({ job, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    skillsRequired: [''],
    location: 'Kigali, Rwanda',
    jobType: 'full-time',
    category: 'technology',
    salaryRange: { min: '', max: '', currency: 'RWF' },
    applicationDeadline: '',
    applicationProcess: 'quick-apply',
    externalLink: '',
    applicationEmail: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: job.requirements || [''],
        skillsRequired: job.skillsRequired || [''],
        location: job.location || 'Kigali, Rwanda',
        jobType: job.jobType || 'full-time',
        category: job.category || 'technology',
        salaryRange: job.salaryRange || { min: '', max: '', currency: 'RWF' },
        applicationDeadline: job.applicationDeadline 
          ? new Date(job.applicationDeadline).toISOString().split('T')[0]
          : '',
        applicationProcess: job.applicationProcess || 'quick-apply',
        externalLink: job.externalLink || '',
        applicationEmail: job.applicationEmail || ''
      });
    }
  }, [job]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [name]: value
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Job title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Job description is required');
      return;
    }
    if (!formData.requirements.some(r => r.trim())) {
      setError('At least one requirement is required');
      return;
    }
    if (!formData.applicationDeadline) {
      setError('Application deadline is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Not authenticated. Please log in first.');
        setLoading(false);
        return;
      }
      
      const url = job 
        ? `http://localhost:5000/api/jobs/${job._id}`
        : 'http://localhost:5000/api/jobs';
      const method = job ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        skillsRequired: formData.skillsRequired.filter(s => s.trim())
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      setSuccess(job ? 'Job updated successfully!' : 'Job posted successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-form-overlay">
      <div className="job-form-container">
        <div className="job-form-header">
          <h2>{job ? 'Edit Job' : 'Post New Job'}</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Full Stack Developer"
                maxLength="100"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Job Type *</label>
                <select name="jobType" value={formData.jobType} onChange={handleInputChange}>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="engineering">Engineering</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Kigali, Rwanda"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Job Details</h3>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the job, responsibilities, and what you're looking for..."
                rows="6"
                maxLength="2000"
              />
              <small>{formData.description.length}/2000</small>
            </div>

            <div className="form-group">
              <label>Requirements *</label>
              {formData.requirements.map((req, idx) => (
                <div key={idx} className="array-input">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', idx, e.target.value)}
                    placeholder={`Requirement ${idx + 1}`}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeArrayItem('requirements', idx)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => addArrayItem('requirements')}
              >
                <Plus size={18} /> Add Requirement
              </button>
            </div>

            <div className="form-group">
              <label>Skills Required</label>
              {formData.skillsRequired.map((skill, idx) => (
                <div key={idx} className="array-input">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('skillsRequired', idx, e.target.value)}
                    placeholder={`Skill ${idx + 1}`}
                  />
                  {formData.skillsRequired.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeArrayItem('skillsRequired', idx)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => addArrayItem('skillsRequired')}
              >
                <Plus size={18} /> Add Skill
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3>Salary & Compensation</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Salary</label>
                <input
                  type="number"
                  name="min"
                  value={formData.salaryRange.min}
                  onChange={handleSalaryChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Maximum Salary</label>
                <input
                  type="number"
                  name="max"
                  value={formData.salaryRange.max}
                  onChange={handleSalaryChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select name="currency" value={formData.salaryRange.currency} onChange={handleSalaryChange}>
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Application Settings</h3>

            <div className="form-group">
              <label>Application Deadline *</label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Application Process</label>
              <select name="applicationProcess" value={formData.applicationProcess} onChange={handleInputChange}>
                <option value="quick-apply">Quick Apply</option>
                <option value="external-link">External Link</option>
                <option value="email">Email</option>
              </select>
            </div>

            {formData.applicationProcess === 'external-link' && (
              <div className="form-group">
                <label>External Application Link</label>
                <input
                  type="url"
                  name="externalLink"
                  value={formData.externalLink}
                  onChange={handleInputChange}
                  placeholder="https://example.com/apply"
                />
              </div>
            )}

            {formData.applicationProcess === 'email' && (
              <div className="form-group">
                <label>Application Email</label>
                <input
                  type="email"
                  name="applicationEmail"
                  value={formData.applicationEmail}
                  onChange={handleInputChange}
                  placeholder="jobs@company.com"
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : (job ? 'Update Job' : 'Post Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostForm;
