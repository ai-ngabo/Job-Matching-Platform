import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  AlertCircle,
  Briefcase,
  TrendingUp
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is admin
  if (user && user.userType !== 'admin') {
    return (
      <div className="admin-access-denied">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin dashboard.</p>   
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 Fetching admin stats...');
      
      const response = await api.get('/admin/stats');
      
      console.log('✅ Admin stats received:', response.data);
      
      setStats(response.data.stats);
    } catch (err) {
      console.error('❌ Error fetching admin stats:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load admin statistics');
      
      // Set fallback stats for demo
      setStats({
        totalUsers: 150,
        totalJobSeekers: 120,
        totalCompanies: 30,
        approvedCompanies: 25,
        pendingCompanies: 5,
        rejectedCompanies: 0,
        totalJobs: 45,
        activeJobs: 40,
        approvalRate: 83,
        rejectionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick, suffix = '' }) => (     
    <div
      className={`stat-card stat-${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value ?? '0'}{suffix}
        </div>
      </div>
      {onClick && <ArrowRight size={16} className="stat-arrow" />}
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage companies, job seekers, and platform activities</p>      
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={16} />
          {error}
          <button onClick={fetchStats} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals {stats && `(${stats.pendingCompanies})`}
        </button>
        <button
          className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          All Companies {stats && `(${stats.totalCompanies})`}
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobseekers' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobseekers')}
        >
          Job Seekers {stats && `(${stats.totalJobSeekers})`}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              Loading statistics...
            </div>     
          ) : stats ? (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers}
                  color="blue"
                />
                <StatCard
                  icon={Users}
                  label="Job Seekers"
                  value={stats.totalJobSeekers}
                  color="green"
                  onClick={() => setActiveTab('jobseekers')}
                />
                <StatCard
                  icon={Building2}
                  label="Total Companies"
                  value={stats.totalCompanies}
                  color="purple"
                  onClick={() => setActiveTab('companies')}
                />
                <StatCard
                  icon={CheckCircle}
                  label="Approved Companies"
                  value={stats.approvedCompanies}
                  color="success"
                />
                <StatCard
                  icon={Clock}
                  label="Pending Approvals"
                  value={stats.pendingCompanies}
                  color="warning"
                  onClick={() => setActiveTab('pending')}
                />
                <StatCard
                  icon={XCircle}
                  label="Rejected Companies"
                  value={stats.rejectedCompanies}
                  color="danger"
                />
                <StatCard
                  icon={Briefcase}
                  label="Total Jobs"
                  value={stats.totalJobs}
                  color="info"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Active Jobs"
                  value={stats.activeJobs}
                  color="success"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Approval Rate"
                  value={stats.approvalRate}
                  color="success"
                  suffix="%"
                />
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button 
                    className="action-btn" 
                    onClick={() => setActiveTab('pending')}
                    disabled={!stats.pendingCompanies}
                  >
                    <Clock size={20} />
                    Review Pending Companies
                    {stats.pendingCompanies > 0 && (
                      <span className="badge">{stats.pendingCompanies}</span>
                    )}
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => setActiveTab('companies')}
                  >
                    <Building2 size={20} />
                    Manage All Companies
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => setActiveTab('jobseekers')}
                  >
                    <Users size={20} />
                    View Job Seekers
                  </button>
                </div>
              </div>

              {/* Platform Summary */}
              <div className="platform-summary">
                <h3>Platform Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Users:</span>
                    <span className="summary-value">{stats.totalUsers}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Active Jobs:</span>
                    <span className="summary-value">{stats.activeJobs}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Company Approval Rate:</span>
                    <span className="summary-value">{stats.approvalRate}%</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Job Seeker Ratio:</span>
                    <span className="summary-value">
                      {stats.totalUsers > 0 ? Math.round((stats.totalJobSeekers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-error">
              <AlertCircle size={24} />
              <p>No statistics available</p>
              <button onClick={fetchStats} className="retry-btn">
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Other tabs will show their respective components */}
      {activeTab !== 'overview' && (
        <div className="admin-content">
          <div className="tab-placeholder">
            <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management interface would load here.</p>
            <button 
              className="back-to-overview"
              onClick={() => setActiveTab('overview')}
            >
              ← Back to Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;