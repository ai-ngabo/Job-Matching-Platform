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
  Download,
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
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

  // Debug token on component mount
  useEffect(() => {
    console.log('🔍 Admin Dashboard Debug:');
    console.log('User:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('authToken:', localStorage.getItem('authToken'));
    console.log('token:', localStorage.getItem('token'));
  }, [user, isAuthenticated]);

  // Check if user is admin
  useEffect(() => {
    if (user && user.userType !== 'admin') {
      console.warn('⚠️ Non-admin user attempted to access admin dashboard');
    }
  }, [user]);

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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      // Check authentication before making requests
      const token = authService.getToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      if (!user || user.userType !== 'admin') {
        setError('Admin privileges required.');
        return;
      }

      console.log('📊 Fetching all admin data with token:', token.substring(0, 20) + '...');

      // Fetch all data in parallel
      const [statsResponse, usersResponse, companiesResponse, jobsResponse] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users?limit=100'),
        api.get('/api/admin/companies?limit=100'),
        api.get('/api/admin/jobs?limit=50')
      ]);

      console.log('✅ All admin data fetched successfully');

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setCompanies(companiesResponse.data.companies || []);
      setJobs(jobsResponse.data.jobs || []);

      // Filter pending companies from the response
      const pending = companiesResponse.data.companies?.filter(company => 
        company.approvalStatus === 'pending'
      ) || [];
      setPendingCompanies(pending);

    } catch (err) {
      console.error('❌ Error fetching admin data:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        logout();
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.response?.status === 404) {
        setError('Admin API endpoints not found. Please check backend deployment.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load admin data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiAction = async (apiCall, successMessage) => {
    try {
      // Verify we have a token before proceeding
      const token = authService.getToken();
      if (!token) {
        alert('No authentication token found. Please log in again.');
        logout();
        return;
      }

      await apiCall();
      await fetchAllData(); // Refresh data
      alert(successMessage);
    } catch (err) {
      console.error('API action error:', err);
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
      () => api.put(`/api/admin/companies/${companyId}/approve`),
      'Company approved successfully!'
    );
  };

  const handleRejectCompany = (companyId) => {
    handleApiAction(
      () => api.put(`/api/admin/companies/${companyId}/reject`, {
        rejectionReason: 'Rejected by administrator'
      }),
      'Company rejected successfully!'
    );
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    // Prevent self-deletion
    if (userId === user?._id) {
      alert('You cannot delete your own account.');
      return;
    }
    
    handleApiAction(
      () => api.delete(`/api/admin/users/${userId}`),
      'User deleted successfully!'
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRetry = () => {
    fetchAllData();
  };

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

  const UserCard = ({ user: userData }) => (
    <div className="user-card">
      <div className="user-avatar">
        {userData.profile?.firstName?.[0]}{userData.profile?.lastName?.[0] || userData.email[0].toUpperCase()}
      </div>
      <div className="user-info">
        <h4>
          {userData.profile?.firstName && userData.profile?.lastName 
            ? `${userData.profile.firstName} ${userData.profile.lastName}`
            : userData.email
          }
        </h4>
        <p>{userData.email}</p>
        <div className="user-meta">
          <span className={`user-type ${userData.userType}`}>
            {userData.userType}
          </span>
          <span className={`status-badge ${userData.approvalStatus || 'approved'}`}>
            {userData.approvalStatus || 'approved'}
          </span>
          <span className="user-date">
            {new Date(userData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="user-actions">
        <button className="action-btn view" onClick={() => setSelectedUser(userData)}>
          <Eye size={16} />
        </button>
        {userData._id !== user?._id && ( // Prevent self-deletion
          <button className="action-btn delete" onClick={() => handleDeleteUser(userData._id)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );

  const CompanyCard = ({ company, showActions = false }) => (
    <div className={`company-card status-${company.approvalStatus}`}>
      <div className="company-header">
        <div className="company-avatar">
          <Building2 size={20} />
        </div>
        <div className="company-info">
          <h4>{company.company?.name || company.email}</h4>
          <p>{company.email}</p>
          <div className="company-meta">
            <span className="company-industry">
              {company.company?.industry || 'Not specified'}
            </span>
            <span className={`status-badge ${company.approvalStatus}`}>
              {company.approvalStatus}
            </span>
            {company.stats?.totalJobs !== undefined && (
              <span className="job-count">{company.stats.totalJobs} jobs</span>
            )}
          </div>
        </div>
      </div>
      
      {showActions && company.approvalStatus === 'pending' && (
        <div className="company-actions">
          <button 
            className="btn-approve"
            onClick={() => handleApproveCompany(company._id)}
          >
            <CheckCircle size={16} />
            Approve
          </button>
          <button 
            className="btn-reject"
            onClick={() => handleRejectCompany(company._id)}
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      )}
    </div>
  );

  const filteredUsers = users.filter(userData =>
    userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.userType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company?.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Admin Dashboard...</h3>
          <p>Fetching platform data and statistics</p>
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
          <p>Manage your Jobify platform with powerful admin tools</p>
          {user && (
            <div className="user-info">
              <span>Welcome, {user.email} (Admin)</span>
              <span className="user-id">User ID: {user._id}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchAllData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={handleRetry} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
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
          Pending
          {stats?.pendingCompanies > 0 && (
            <span className="tab-badge">{stats.pendingCompanies}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Briefcase size={18} />
          Jobs ({stats?.totalJobs || 0})
        </button>
      </div>

      {/* Search Bar */}
      {(activeTab === 'users' || activeTab === 'companies' || activeTab === 'jobs') && (
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
          <div className="filter-actions">
            <button className="filter-btn">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'overview' && stats && (
          <div className="overview-grid">
            {/* Key Metrics */}
            <div className="metrics-section">
              <h2>Platform Overview</h2>
              <div className="stats-grid">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers}
                  color="blue"
                  onClick={() => setActiveTab('users')}
                  description="Active platform users"
                />
                <StatCard
                  icon={Building2}
                  label="Companies"
                  value={stats.totalCompanies}
                  color="purple"
                  onClick={() => setActiveTab('companies')}
                  description="Registered businesses"
                />
                <StatCard
                  icon={Briefcase}
                  label="Total Jobs"
                  value={stats.totalJobs}
                  color="green"
                  onClick={() => setActiveTab('jobs')}
                  description="Job listings"
                />
                <StatCard
                  icon={FileText}
                  label="Applications"
                  value={stats.totalApplications}
                  color="orange"
                  description="Total applications"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Approval Rate"
                  value={`${stats.approvalRate}%`}
                  color="success"
                  description="Company approval success"
                />
                <StatCard
                  icon={Clock}
                  label="Pending Reviews"
                  value={stats.pendingCompanies}
                  color="warning"
                  onClick={() => setActiveTab('pending')}
                  description="Awaiting approval"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn primary"
                  onClick={() => setActiveTab('pending')}
                  disabled={!stats.pendingCompanies}
                >
                  <Clock size={20} />
                  <span>Review Pending Companies</span>
                  {stats.pendingCompanies > 0 && (
                    <span className="action-badge">{stats.pendingCompanies}</span>
                  )}
                </button>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={20} />
                  <span>Manage Users</span>
                </button>
                <button 
                  className="quick-action-btn tertiary"
                  onClick={() => setActiveTab('companies')}
                >
                  <Building2 size={20} />
                  <span>View All Companies</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => setActiveTab('jobs')}
                >
                  <Briefcase size={20} />
                  <span>Monitor Jobs</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
              <h3>Recent Users</h3>
              <div className="activity-list">
                {users.slice(0, 5).map(userData => (
                  <div key={userData._id} className="activity-item">
                    <div className="activity-avatar">
                      {userData.profile?.firstName?.[0] || userData.email[0].toUpperCase()}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>
                          {userData.profile?.firstName && userData.profile?.lastName 
                            ? `${userData.profile.firstName} ${userData.profile.lastName}`
                            : userData.email
                          }
                        </strong>
                        {' '}joined as {userData.userType}
                      </p>
                      <span className="activity-time">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management ({filteredUsers.length})</h2>
            <div className="users-grid">
              {filteredUsers.map(userData => (
                <UserCard key={userData._id} user={userData} />
              ))}
            </div>
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Users Found</h3>
                <p>No users match your search criteria</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="companies-section">
            <h2>Company Management ({filteredCompanies.length})</h2>
            <div className="companies-grid">
              {filteredCompanies.map(company => (
                <CompanyCard key={company._id} company={company} />
              ))}
            </div>
            {filteredCompanies.length === 0 && (
              <div className="empty-state">
                <Building2 size={48} />
                <h3>No Companies Found</h3>
                <p>No companies match your search criteria</p>
              </div>
            )}
          </div>
        )}

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
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state success">
                <CheckCircle size={48} />
                <h3>All Caught Up!</h3>
                <p>No pending company approvals at this time</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <h2>Job Management ({filteredJobs.length})</h2>
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className={`job-status ${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="job-company">
                    {job.company?.name || job.companyName || 'Unknown Company'}
                  </p>
                  <p className="job-location">{job.location}</p>
                  <div className="job-meta">
                    <span className="job-type">{job.jobType}</span>
                    <span className="job-applications">
                      {job.applicationCount || 0} applications
                    </span>
                    <span className="job-date">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {filteredJobs.length === 0 && (
              <div className="empty-state">
                <Briefcase size={48} />
                <h3>No Jobs Found</h3>
                <p>No jobs match your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Details</h3>
              <button onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <div className="detail-avatar">
                  {selectedUser.profile?.firstName?.[0]}{selectedUser.profile?.lastName?.[0] || selectedUser.email[0].toUpperCase()}
                </div>
                <div className="detail-info">
                  <h4>
                    {selectedUser.profile?.firstName && selectedUser.profile?.lastName 
                      ? `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`
                      : selectedUser.email
                    }
                  </h4>
                  <p>{selectedUser.email}</p>
                  <div className="detail-meta">
                    <span className={`user-type ${selectedUser.userType}`}>
                      {selectedUser.userType}
                    </span>
                    <span className={`status-badge ${selectedUser.approvalStatus || 'approved'}`}>
                      {selectedUser.approvalStatus || 'approved'}
                    </span>
                    <span>Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    <span>Active: {selectedUser.isActive !== false ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;