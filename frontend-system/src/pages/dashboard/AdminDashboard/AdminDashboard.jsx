import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AdminStats from '../../../components/admin/AdminStats';
import PendingCompanies from '../../../components/admin/PendingCompanies';
import AllCompanies from '../../../components/admin/AllCompanies';
import AllJobSeekers from '../../../components/admin/AllJobSeekers';
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
        <p>Only administrators can access this area.</p>
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
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
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
        <div className="stat-value">{value ?? '-'}</div>
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
          Pending Approvals ({stats?.pendingCompanies || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          All Companies ({stats?.totalCompanies || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobseekers' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobseekers')}
        >
          Job Seekers ({stats?.totalJobSeekers || 0})
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {activeTab === 'overview' && (
        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">Loading statistics...</div>
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
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button className="action-btn" onClick={() => setActiveTab('pending')}>
                    <Clock size={20} />
                    Review Pending Companies
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('companies')}>
                    <Building2 size={20} />
                    Manage Companies
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('jobseekers')}>
                    <Users size={20} />
                    View Job Seekers
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="admin-content">
          <PendingCompanies onApprovalChange={fetchStats} />
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="admin-content">
          <AllCompanies />
        </div>
      )}

      {activeTab === 'jobseekers' && (
        <div className="admin-content">
          <AllJobSeekers />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
