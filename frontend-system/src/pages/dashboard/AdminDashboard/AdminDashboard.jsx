import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  Shield,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { authService } from '../../../services/authService';
import './AdminDashboard.css';

// ==================== UTILITY FUNCTIONS ====================

const getUserDisplayName = (userData) => {
  if (userData.profile?.firstName && userData.profile?.lastName) {
    return `${userData.profile.firstName} ${userData.profile.lastName}`;
  }
  return userData.email;
};

const getUserInitials = (userData) => {
  const first = userData.profile?.firstName?.[0] || userData.email[0];
  const last = userData.profile?.lastName?.[0] || userData.email[0];
  return (first + last).toUpperCase();
};

// ==================== REUSABLE COMPONENTS ====================

const StatCard = ({ icon: Icon, label, value, color, onClick, description }) => (
  <div
    className={`stat-card stat-${color} ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
  >
    <div className="stat-header">
      <div className="stat-icon">
        <Icon size={24} />
      </div>
    </div>
    <div className="stat-content">
      <div className="stat-value">{value ?? '0'}</div>
      <div className="stat-label">{label}</div>
      {description && <div className="stat-description">{description}</div>}
    </div>
    {onClick && <ArrowRight size={16} className="stat-arrow" />}
  </div>
);

const UserCard = ({ user: userData, onView, onDelete }) => (
  <div className="user-card">
    <div className="user-avatar">{getUserInitials(userData)}</div>
    <div className="user-info">
      <h4>{getUserDisplayName(userData)}</h4>
      <p>{userData.email}</p>
      <div className="user-meta">
        <span className={`user-type ${userData.userType}`}>{userData.userType}</span>
        <span className={`status-badge ${userData.approvalStatus || 'approved'}`}>
          {userData.approvalStatus || 'approved'}
        </span>
        <span className="user-date">{new Date(userData.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <div className="user-actions">
      <button className="action-btn view" onClick={() => onView?.(userData)}>
        <Eye size={16} />
      </button>
      {onDelete && (
        <button className="action-btn delete" onClick={() => onDelete?.(userData._id)}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </div>
);

const CompanyCard = ({ company, showActions = false, onView, onApprove, onReject }) => (
  <div className={`company-card status-${company.approvalStatus}`}>
    <div className="company-header" onClick={() => onView?.(company)} style={{ cursor: onView ? 'pointer' : 'default' }}>
      <div className="company-avatar">
        <Building2 size={20} />
      </div>
      <div className="company-info">
        <h4>{company.company?.name || company.email}</h4>
        <p>{company.email}</p>
        <div className="company-meta">
          <span className="company-industry">{company.company?.industry || 'Not specified'}</span>
          <span className={`status-badge ${company.approvalStatus}`}>{company.approvalStatus}</span>
          {company.stats?.totalJobs !== undefined && (
            <span className="job-count">{company.stats.totalJobs} jobs</span>
          )}
        </div>
      </div>
    </div>
    
    {showActions && company.approvalStatus === 'pending' && (
      <div className="company-actions">
        <button className="btn-approve" onClick={() => onApprove?.(company._id)}>
          <CheckCircle size={16} />
          Approve
        </button>
        <button className="btn-reject" onClick={() => onReject?.(company._id)}>
          <XCircle size={16} />
          Reject
        </button>
      </div>
    )}
  </div>
);

const UserDetailModal = ({ user, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>User Details</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <div className="user-detail">
          <div className="detail-avatar">{getUserInitials(user)}</div>
          <div className="detail-info">
            <h4>{getUserDisplayName(user)}</h4>
            <p>{user.email}</p>
            <div className="detail-meta">
              <span className={`user-type ${user.userType}`}>{user.userType}</span>
              <span className={`status-badge ${user.approvalStatus || 'approved'}`}>
                {user.approvalStatus || 'approved'}
              </span>
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              <span>Active: {user.isActive !== false ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CompanyDetailModal = ({ company, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Company Details</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <div className="company-detail">
          <div className="detail-header">
            <div className="detail-avatar">
              <Building2 size={32} />
            </div>
            <div className="detail-info">
              <h4>{company.company?.name || company.email}</h4>
              <p>{company.email}</p>
              <span className={`status-badge ${company.approvalStatus}`}>
                {company.approvalStatus}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h5>Company Information</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Industry</label>
                <p>{company.company?.industry || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <label>Website</label>
                <p>{company.company?.website || 'Not provided'}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{company.company?.location || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <label>Size</label>
                <p>{company.company?.size || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h5>Description</h5>
            <p className="description-text">{company.company?.description || 'No description provided'}</p>
          </div>

          <div className="detail-section">
            <h5>Statistics</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Total Jobs</label>
                <p>{company.stats?.totalJobs || 0}</p>
              </div>
              <div className="detail-item">
                <label>Total Applications</label>
                <p>{company.stats?.totalApplications || 0}</p>
              </div>
              <div className="detail-item">
                <label>Joined</label>
                <p>{new Date(company.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Debug and check authentication
  useEffect(() => {
    console.log('🔍 Admin Dashboard - User:', user?.userType);
  }, [user]);

  // Fetch data when user is loaded and is admin
  useEffect(() => {
    if (user && user.userType === 'admin') {
      fetchAllData();
    }
  }, [user?.userType]);

  // Redirect if not admin
  if (user && user.userType !== 'admin') {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <Shield size={64} className="shield-icon" />
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
          <p>This area is restricted to administrators only.</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = authService.getToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('📊 Fetching admin data with token...');

      const [statsResponse, usersResponse, companiesResponse, jobsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
        api.get('/admin/companies?limit=100'),
        api.get('/admin/jobs?limit=50')
      ]);

      console.log('✅ Data fetched successfully');

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setCompanies(companiesResponse.data.companies || []);
      setJobs(jobsResponse.data.jobs || []);

      const pending = companiesResponse.data.companies?.filter(
        company => company.approvalStatus === 'pending'
      ) || [];
      setPendingCompanies(pending);

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        logout();
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.response?.status === 404) {
        setError('Admin endpoints not found. Backend may not be deployed.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiAction = async (apiCall, successMessage) => {
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No authentication token found. Please log in again.');
        logout();
        return;
      }

      await apiCall();
      await fetchAllData();
      alert(successMessage);
    } catch (err) {
      console.error('API error:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        logout();
      } else {
        alert(err.response?.data?.message || 'Action failed');
      }
    }
  };

  const handleApproveCompany = (companyId) => {
    handleApiAction(
      () => api.put(`/admin/companies/${companyId}/approve`),
      'Company approved successfully!'
    );
  };

  const handleRejectCompany = (companyId) => {
    handleApiAction(
      () => api.put(`/admin/companies/${companyId}/reject`, {
        rejectionReason: 'Rejected by administrator'
      }),
      'Company rejected successfully!'
    );
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    if (userId === user?._id) {
      alert('You cannot delete your own account.');
      return;
    }
    
    handleApiAction(
      () => api.delete(`/admin/users/${userId}`),
      'User deleted successfully!'
    );
  };

  // Filters
  const filteredUsers = users.filter(userData =>
    userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Admin Dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage your Jobify platform</p>
          {user && (
            <div className="user-info">
              <span>Welcome, {user.email}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchAllData} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchAllData} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users ({stats?.totalUsers || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          <Building2 size={18} />
          Companies ({stats?.totalCompanies || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} />
          Pending {stats?.pendingCompanies > 0 && <span className="tab-badge">{stats.pendingCompanies}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Briefcase size={18} />
          Jobs ({stats?.totalJobs || 0})
        </button>
      </div>

      {/* Search */}
      {['users', 'companies', 'jobs'].includes(activeTab) && (
        <div className="search-section">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="admin-content">
        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div className="overview-grid">
            <div className="metrics-section">
              <h2>Platform Overview</h2>
              <div className="stats-grid">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
                <StatCard icon={Building2} label="Companies" value={stats.totalCompanies} color="purple" />
                <StatCard icon={Briefcase} label="Jobs" value={stats.totalJobs} color="green" />
                <StatCard icon={FileText} label="Applications" value={stats.totalApplications} color="orange" />
                <StatCard icon={CheckCircle} label="Approval Rate" value={`${stats.approvalRate}%`} color="success" />
                <StatCard icon={Clock} label="Pending" value={stats.pendingCompanies} color="warning" />
              </div>
            </div>

            <div className="activity-section">
              <h3>Recent Users</h3>
              <div className="activity-list">
                {users.slice(0, 5).map(userData => (
                  <div key={userData._id} className="activity-item">
                    <div className="activity-avatar">{getUserInitials(userData)}</div>
                    <div className="activity-content">
                      <p><strong>{getUserDisplayName(userData)}</strong> joined as {userData.userType}</p>
                      <span className="activity-time">{new Date(userData.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management ({filteredUsers.length})</h2>
            <div className="users-grid">
              {filteredUsers.map(userData => (
                <UserCard 
                  key={userData._id} 
                  user={userData}
                  onView={setSelectedUser}
                  onDelete={userData._id !== user?._id ? handleDeleteUser : null}
                />
              ))}
            </div>
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Users Found</h3>
              </div>
            )}
          </div>
        )}

        {/* Companies */}
        {activeTab === 'companies' && (
          <div className="companies-section">
            <h2>Company Management ({filteredCompanies.length})</h2>
            <div className="companies-grid">
              {filteredCompanies.map(company => (
                <CompanyCard key={company._id} company={company} onView={setSelectedCompany} />
              ))}
            </div>
            {filteredCompanies.length === 0 && (
              <div className="empty-state">
                <Building2 size={48} />
                <h3>No Companies Found</h3>
              </div>
            )}
          </div>
        )}

        {/* Pending */}
        {activeTab === 'pending' && (
          <div className="pending-section">
            <h2>Pending Approvals ({pendingCompanies.length})</h2>
            {pendingCompanies.length > 0 ? (
              <div className="pending-grid">
                {pendingCompanies.map(company => (
                  <CompanyCard 
                    key={company._id} 
                    company={company} 
                    showActions={true}
                    onApprove={handleApproveCompany}
                    onReject={handleRejectCompany}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state success">
                <CheckCircle size={48} />
                <h3>All Caught Up!</h3>
              </div>
            )}
          </div>
        )}

        {/* Jobs */}
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <h2>Job Management ({filteredJobs.length})</h2>
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className={`job-status ${job.status}`}>{job.status}</span>
                  </div>
                  <p className="job-company">{job.company?.name || 'Unknown'}</p>
                  <p className="job-location">{job.location}</p>
                  <div className="job-meta">
                    <span>{job.applicationCount || 0} applications</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {filteredJobs.length === 0 && (
              <div className="empty-state">
                <Briefcase size={48} />
                <h3>No Jobs Found</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {selectedCompany && (
        <CompanyDetailModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};

export default AdminDashboard;
