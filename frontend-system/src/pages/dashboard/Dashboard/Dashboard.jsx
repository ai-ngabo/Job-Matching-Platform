import React, { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobSeekerDashboard from '../JobSeekerDashboard/JobSeekerDashboard';
import CompanyDashboard from '../CompanyDashboard/CompanyDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.userType === 'admin') {
      navigate('/admin');
    }
  }, [user?.userType, navigate]);

  if (user?.userType === 'admin') {
    return <div className="dashboard-loading">Redirecting to Admin Dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {user.userType === 'jobseeker' ? (
          <JobSeekerDashboard />
        ) : user.userType === 'company' ? (
          <CompanyDashboard />
        ) : (
          <div>Dashboard not available for your account type</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;