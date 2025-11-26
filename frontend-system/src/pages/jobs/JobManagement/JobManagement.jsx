import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import JobPostForm from '../../../components/jobs/JobPostForm';
import './JobManagement.css';

const JobManagement = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        console.warn('No token found - user may not be logged in');
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/jobs/company/my-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Not authenticated. Please log in.');
        return;
      }
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete job');
      }

      setJobs(jobs.filter(j => j._id !== jobId));
      alert('Job deleted successfully');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job: ' + err.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={18} className="status-icon active" />;
      case 'paused':
        return <Clock size={18} className="status-icon paused" />;
      case 'closed':
        return <XCircle size={18} className="status-icon closed" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'paused':
        return 'status-paused';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(j => j.status === filter);

  if (!user || user.userType !== 'company') {
    return (
      <div className="job-management-container">
        <p>Only companies can post jobs</p>
      </div>
    );
  }

  return (
    <div className="job-management-container">
      <div className="job-management-header">
        <h1>Job Management</h1>
        <button 
          className="btn-post-job"
          onClick={() => {
            setEditingJob(null);
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          Post New Job
        </button>
      </div>

      {error && <div className="job-error">{error}</div>}

      {showForm && (
        <JobPostForm
          job={editingJob}
          onSuccess={() => {
            setShowForm(false);
            setEditingJob(null);
            fetchJobs();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingJob(null);
          }}
        />
      )}

      {!showForm && (
        <>
          <div className="job-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({jobs.filter(j => j.status === 'active').length})
            </button>
            <button
              className={`filter-btn ${filter === 'paused' ? 'active' : ''}`}
              onClick={() => setFilter('paused')}
            >
              Paused ({jobs.filter(j => j.status === 'paused').length})
            </button>
            <button
              className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
              onClick={() => setFilter('closed')}
            >
              Closed ({jobs.filter(j => j.status === 'closed').length})
            </button>
          </div>

          {loading ? (
            <div className="job-loading">Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="job-empty">
              <p>No jobs posted yet</p>
              <button 
                className="btn-post-job-empty"
                onClick={() => setShowForm(true)}
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="jobs-table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Applications</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job._id}>
                      <td className="job-title">{job.title}</td>
                      <td>{job.jobType}</td>
                      <td>{job.location}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(job.status)}`}>
                          {getStatusIcon(job.status)}
                          {job.status}
                        </span>
                      </td>
                      <td className="text-center">{job.views || 0}</td>
                      <td className="text-center">{job.applicationCount || 0}</td>
                      <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="job-actions">
                        <button
                          className="action-btn view-btn"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => {
                            setEditingJob(job);
                            setShowForm(true);
                          }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteJob(job._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobManagement;
