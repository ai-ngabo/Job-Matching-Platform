import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Mail, Building2, FileText } from 'lucide-react';
import './PendingCompanies.css';

const PendingCompanies = ({ onApprovalChange }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/admin/companies/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending companies');
      }

      const data = await response.json();
      setCompanies(data.companies);
    } catch (err) {
      console.error('Error fetching pending companies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [companyId]: true }));
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/admin/companies/${companyId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve company');
      }

      setCompanies(companies.filter(c => c._id !== companyId));
      onApprovalChange?.();
    } catch (err) {
      console.error('Error approving company:', err);
      alert('Failed to approve company: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleReject = async (companyId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setActionLoading(prev => ({ ...prev, [companyId]: true }));
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/admin/companies/${companyId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject company');
      }

      setCompanies(companies.filter(c => c._id !== companyId));
      onApprovalChange?.();
    } catch (err) {
      console.error('Error rejecting company:', err);
      alert('Failed to reject company: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  if (loading) {
    return <div className="pending-loading">Loading pending companies...</div>;
  }

  if (error) {
    return <div className="pending-error">{error}</div>;
  }

  if (companies.length === 0) {
    return (
      <div className="pending-empty">
        <CheckCircle size={48} />
        <p>No pending company approvals</p>
      </div>
    );
  }

  return (
    <div className="pending-companies">
      <h2>Pending Company Approvals ({companies.length})</h2>
      <div className="companies-list">
        {companies.map((company) => (
          <div key={company._id} className="company-card">
            <div className="company-header" onClick={() => setExpandedId(expandedId === company._id ? null : company._id)}>
              <div className="company-info">
                <Building2 size={24} />
                <div>
                  <h3>{company.company?.name || 'Company Name'}</h3>
                  <div className="company-meta">
                    <Mail size={14} />
                    <span>{company.email}</span>
                  </div>
                </div>
              </div>
              <div className="expand-indicator">
                {expandedId === company._id ? '▼' : '▶'}
              </div>
            </div>

            {expandedId === company._id && (
              <div className="company-details">
                <div className="detail-section">
                  <h4>Company Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Industry</span>
                      <span className="detail-value">{company.company?.industry || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Website</span>
                      <span className="detail-value">
                        {company.company?.website ? (
                          <a href={company.company.website} target="_blank" rel="noopener noreferrer">
                            {company.company.website}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="company-description">
                    {company.company?.description || 'No description provided'}
                  </p>
                </div>

                <div className="detail-section">
                  <h4>Contact Person</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">
                        {company.company?.contact?.personName || 'Not specified'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Position</span>
                      <span className="detail-value">
                        {company.company?.contact?.personPosition || 'Not specified'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">
                        {company.company?.contact?.phone || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {company.company?.businessRegistration?.certificate?.url && (
                  <div className="detail-section">
                    <h4>Business Certificate</h4>
                    <a 
                      href={company.company.businessRegistration.certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="certificate-link"
                    >
                      <FileText size={16} />
                      View Certificate
                    </a>
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(company._id)}
                    disabled={actionLoading[company._id]}
                  >
                    <CheckCircle size={18} />
                    {actionLoading[company._id] ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(company._id)}
                    disabled={actionLoading[company._id]}
                  >
                    <XCircle size={18} />
                    {actionLoading[company._id] ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingCompanies;
