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
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Check if user is admin
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

      console.log('📊 Fetching all admin data...');

      // Fetch all data in parallel
      const [statsResponse, usersResponse, companiesResponse, jobsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
        api.get('/admin/companies?limit=100'),
        api.get('/admin/jobs?limit=50')
      ]);

      console.log('✅ All admin data fetched successfully:', {
        stats: statsResponse.data,
        users: usersResponse.data,
        companies: companiesResponse.data,
        jobs: jobsResponse.data
      });

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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load admin data';
      setError(errorMessage);
      
      // Log detailed error info for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompany = async (companyId) => {
    try {
      console.log(`Approving company: ${companyId}`);
      await api.put(`/admin/companies/${companyId}/approve`);
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company._id === companyId 
          ? { ...company, approvalStatus: 'approved' }
          : company
      ));
      
      setPendingCompanies(prev => prev.filter(company => company._id !== companyId));
      
      // Refresh stats
      await fetchAllData();
      
      alert('Company approved successfully!');
    } catch (err) {
      console.error('Error approving company:', err);
      alert(err.response?.data?.message || 'Failed to approve company');
    }
  };

  const handleRejectCompany = async (companyId) => {
    try {
      console.log(`Rejecting company: ${companyId}`);
      await api.put(`/admin/companies/${companyId}/reject`, {
        rejectionReason: 'Rejected by administrator'
      });
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company._id === companyId 
          ? { ...company, approvalStatus: 'rejected' }
          : company
      ));
      
      setPendingCompanies(prev => prev.filter(company => company._id !== companyId));
      
      // Refresh stats
      await fetchAllData();
      
      alert('Company rejected successfully!');
    } catch (err) {
      console.error('Error rejecting company:', err);
      alert(err.response?.data?.message || 'Failed to reject company');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      console.log(`Deleting user: ${userId}`);
      await api.delete(`/admin/users/${userId}`);
      
      // Update local state
      setUsers(prev => prev.filter(user => user._id !== userId));
      setCompanies(prev => prev.filter(company => company._id !== userId));
      
      // Refresh stats
      await fetchAllData();
      
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
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

  const UserCard = ({ user }) => (
    <div className="user-card">
      <div className="user-avatar">
        {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0] || user.email[0].toUpperCase()}
      </div>
      <div className="user-info">
        <h4>
          {user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email
          }
        </h4>
        <p>{user.email}</p>
        <div className="user-meta">
          <span className={`user-type ${user.userType}`}>
            {user.userType}
          </span>
          <span className={`status-badge ${user.approvalStatus || 'approved'}`}>
            {user.approvalStatus || 'approved'}
          </span>
          <span className="user-date">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="user-actions">
        <button className="action-btn view" onClick={() => setSelectedUser(user)}>
          <Eye size={16} />
        </button>
        {user._id !== user?._id && ( // Prevent self-deletion
          <button className="action-btn delete" onClick={() => handleDeleteUser(user._id)}>
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userType?.toLowerCase().includes(searchTerm.toLowerCase())
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
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchAllData}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="btn-export">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchAllData} className="retry-btn">Retry</button>
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
                {users.slice(0, 5).map(user => (
                  <div key={user._id} className="activity-item">
                    <div className="activity-avatar">
                      {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>
                          {user.profile?.firstName && user.profile?.lastName 
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.email
                          }
                        </strong>
                        {' '}joined as {user.userType}
                      </p>
                      <span className="activity-time">
                        {new Date(user.createdAt).toLocaleDateString()}
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
              {filteredUsers.map(user => (
                <UserCard key={user._id} user={user} />
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