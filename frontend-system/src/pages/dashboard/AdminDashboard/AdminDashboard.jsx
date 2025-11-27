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
  Mail,
  Calendar,
  Shield,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download
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
  const [selectedCompany, setSelectedCompany] = useState(null);

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

      // Fetch all data in parallel using your API service
      const [statsResponse, usersResponse, companiesResponse, jobsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
        api.get('/admin/companies?limit=100'),
        api.get('/admin/jobs?limit=50')
      ]);

      console.log('✅ All admin data fetched successfully');

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setCompanies(companiesResponse.data.companies || []);
      setJobs(jobsResponse.data.jobs || []);

      // Filter pending companies
      const pending = companiesResponse.data.companies?.filter(company => 
        company.approvalStatus === 'pending'
      ) || [];
      setPendingCompanies(pending);

    } catch (err) {
      console.error('❌ Error fetching admin data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    setStats({
      totalUsers: 156,
      totalJobSeekers: 124,
      totalCompanies: 32,
      approvedCompanies: 26,
      pendingCompanies: 6,
      rejectedCompanies: 0,
      totalJobs: 47,
      activeJobs: 42,
      approvalRate: 81,
      totalApplications: 189
    });

    setUsers([
      {
        _id: '1',
        email: 'john@example.com',
        userType: 'jobseeker',
        profile: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        isActive: true
      },
      {
        _id: '2', 
        email: 'sarah@example.com',
        userType: 'jobseeker', 
        profile: { firstName: 'Sarah', lastName: 'Smith' },
        createdAt: new Date(),
        isActive: true
      }
    ]);

    setCompanies([
      {
        _id: '1',
        email: 'tech@company.com',
        approvalStatus: 'approved',
        company: { name: 'Tech Solutions Inc.', industry: 'Technology' },
        createdAt: new Date()
      },
      {
        _id: '2',
        email: 'finance@firm.com', 
        approvalStatus: 'pending',
        company: { name: 'Finance Partners', industry: 'Finance' },
        createdAt: new Date()
      }
    ]);

    setPendingCompanies([
      {
        _id: '2',
        email: 'finance@firm.com',
        approvalStatus: 'pending',
        company: { name: 'Finance Partners', industry: 'Finance' },
        createdAt: new Date()
      }
    ]);
  };

  const handleApproveCompany = async (companyId) => {
    try {
      await api.put(`/admin/companies/${companyId}/approve`);
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company._id === companyId 
          ? { ...company, approvalStatus: 'approved' }
          : company
      ));
      
      setPendingCompanies(prev => prev.filter(company => company._id !== companyId));
      
      // Refresh stats
      fetchAllData();
      
      alert('Company approved successfully!');
    } catch (err) {
      console.error('Error approving company:', err);
      alert('Failed to approve company');
    }
  };

  const handleRejectCompany = async (companyId) => {
    try {
      await api.put(`/admin/companies/${companyId}/reject`);
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company._id === companyId 
          ? { ...company, approvalStatus: 'rejected' }
          : company
      ));
      
      setPendingCompanies(prev => prev.filter(company => company._id !== companyId));
      
      // Refresh stats
      fetchAllData();
      
      alert('Company rejected successfully!');
    } catch (err) {
      console.error('Error rejecting company:', err);
      alert('Failed to reject company');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(user => user._id !== userId));
      fetchAllData();
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick, trend, description }) => (
    <div
      className={`stat-card stat-${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-header">
        <div className="stat-icon">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            <TrendingUp size={14} />
            {Math.abs(trend)}%
          </div>
        )}
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
        {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
      </div>
      <div className="user-info">
        <h4>{user.profile?.firstName} {user.profile?.lastName}</h4>
        <p>{user.email}</p>
        <div className="user-meta">
          <span className={`user-type ${user.userType}`}>
            {user.userType}
          </span>
          <span className="user-date">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="user-actions">
        <button className="action-btn view" onClick={() => setSelectedUser(user)}>
          <Eye size={16} />
        </button>
        <button className="action-btn delete" onClick={() => handleDeleteUser(user._id)}>
          <Trash2 size={16} />
        </button>
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
          <h4>{company.company?.name || 'Unnamed Company'}</h4>
          <p>{company.email}</p>
          <div className="company-meta">
            <span className="company-industry">
              {company.company?.industry || 'Not specified'}
            </span>
            <span className={`status-badge ${company.approvalStatus}`}>
              {company.approvalStatus}
            </span>
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
    user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Refresh size={16} />
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
      <div className="search-section">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users, companies, jobs..."
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
                  trend={12}
                  description="Active platform users"
                />
                <StatCard
                  icon={Building2}
                  label="Companies"
                  value={stats.totalCompanies}
                  color="purple"
                  onClick={() => setActiveTab('companies')}
                  trend={8}
                  description="Registered businesses"
                />
                <StatCard
                  icon={Briefcase}
                  label="Total Jobs"
                  value={stats.totalJobs}
                  color="green"
                  onClick={() => setActiveTab('jobs')}
                  trend={15}
                  description="Job listings"
                />
                <StatCard
                  icon={FileText}
                  label="Applications"
                  value={stats.totalApplications || 189}
                  color="orange"
                  trend={22}
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
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {users.slice(0, 5).map(user => (
                  <div key={user._id} className="activity-item">
                    <div className="activity-avatar">
                      {user.profile?.firstName?.[0]}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{user.profile?.firstName} {user.profile?.lastName}</strong>
                        {' '}joined the platform
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
            <h2>Job Management ({jobs.length})</h2>
            <div className="jobs-grid">
              {jobs.slice(0, 10).map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className={`job-status ${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="job-company">{job.companyName}</p>
                  <p className="job-location">{job.location}</p>
                  <div className="job-meta">
                    <span className="job-type">{job.jobType}</span>
                    <span className="job-date">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                  {selectedUser.profile?.firstName?.[0]}{selectedUser.profile?.lastName?.[0]}
                </div>
                <div className="detail-info">
                  <h4>{selectedUser.profile?.firstName} {selectedUser.profile?.lastName}</h4>
                  <p>{selectedUser.email}</p>
                  <div className="detail-meta">
                    <span className="user-type">{selectedUser.userType}</span>
                    <span>Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
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

// Add missing Refresh component
const Refresh = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

export default AdminDashboard;