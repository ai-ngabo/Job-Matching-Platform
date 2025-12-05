import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import JobPostForm from '../../../components/jobs/JobPostForm';
import './JobManagement.css';

const JobManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  const location = useLocation();

  // If navigated with an editJobId in state, open the edit modal once jobs are loaded
  useEffect(() => {
    if (!location?.state?.editJobId) return;
    const editId = location.state.editJobId;
    const found = jobs.find(j => j._id === editId);
    if (found) {
      setEditingJob(found);
      setShowForm(true);
      // clear state to avoid reopening
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, jobs]);

  const fetchCompanyJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/jobs/company/my-jobs');
      setJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Error fetching company jobs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (jobId) => {
    // pass state so JobDetails knows this is a company view
    navigate(`/jobs/${jobId}`, { state: { companyView: true } });
  };

  const handleOpenNew = () => {
    setEditingJob(null);
    setShowForm(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete job');
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      const resp = await api.put(`/jobs/${job._id}`, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === job._id ? resp.data.job || resp.data : j));
    } catch (err) {
      console.error('Error updating job status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const onFormSuccess = () => {
    setShowForm(false);
    setEditingJob(null);
    fetchCompanyJobs();
  };

  return (
    <div className="company-job-management">
      <div className="management-header">
        <div>
          <h1>Manage Jobs</h1>
          <p>Post, edit, and manage your job listings</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenNew}>Post New Job</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading your jobs...</div>
      ) : (
        <div className="jobs-list">
          {jobs.length === 0 ? (
            <div className="no-jobs">
              <p>No job postings yet.</p>
              <button className="btn btn-primary" onClick={handleOpenNew}>Post Your First Job</button>
            </div>
          ) : (
            jobs.map(job => (
              <div className="job-card" key={job._id}>
                <div className="job-card-left">
                  <h3>{job.title}</h3>
                  <p className="meta">{job.location} • {job.jobType} • Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                  <div className="badges">
                    <span className={`status ${job.status}`}>{job.status || 'new'}</span>
                    <span className="meta-tag">{job.applicationCount || 0} applicants</span>
                    <span className="meta-tag">{job.views || 0} views</span>
                  </div>
                </div>

                <div className="job-card-actions">
                  <button className="btn" onClick={() => handleView(job._id)}>View</button>
                  <button className="btn" onClick={() => handleEdit(job)}>Edit</button>
                  <button className="btn" onClick={() => handleToggleStatus(job)}>{job.status === 'active' ? 'Close' : 'Make Active'}</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(job._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <JobPostForm
          job={editingJob}
          onSuccess={onFormSuccess}
          onCancel={() => { setShowForm(false); setEditingJob(null); }}
        />
      )}
    </div>
  );
};

export default JobManagement;