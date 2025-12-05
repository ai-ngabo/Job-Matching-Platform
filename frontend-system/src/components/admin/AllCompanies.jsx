import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import './AllCompanies.css';
import UserDetailModal from './UserDetailModal';

const AllCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  const fetchAllCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/admin/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.companies);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} className="status-icon approved" />;
      case 'pending':
        return <Clock size={18} className="status-icon pending" />;
      case 'rejected':
        return <XCircle size={18} className="status-icon rejected" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const filteredCompanies = filterStatus === 'all'
    ? companies
    : companies.filter(c => c.approvalStatus === filterStatus);

  if (loading) {
    return <div className="companies-loading">Loading companies...</div>;
  }

  if (error) {
    return <div className="companies-error">{error}</div>;
  }

  return (
    <div className="all-companies">
      <div className="companies-header">
        <h2>All Companies ({companies.length})</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="companies-empty">
          <Building2 size={48} />
          <p>No companies found</p>
        </div>
      ) : (
        <div className="companies-table-wrapper">
          <table className="companies-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Email</th>
                <th>Industry</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company._id}>
                  <td>
                    <div className="company-name-cell">
                      <Building2 size={18} />
                      <span>{company.company?.name || 'Company'}</span>
                    </div>
                  </td>
                  <td>{company.email}</td>
                  <td>{company.company?.industry || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(company.approvalStatus)}`}>
                      {getStatusIcon(company.approvalStatus)}
                      {company.approvalStatus || 'pending'}
                    </span>
                  </td>
                  <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-action-btn"
                      onClick={() => setSelectedUser(company)}
                      title="View all details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          userType="company"
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default AllCompanies;
