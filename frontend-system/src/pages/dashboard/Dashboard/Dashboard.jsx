import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import JobSeekerDashboard from '../JobSeekerDashboard/JobSeekerDashboard';
//import CompanyDashboard from '../CompanyDashboard/CompanyDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {user.userType === 'jobseeker' ? (
          <JobSeekerDashboard />
        ) : (
          <div>Company dashboard coming soon</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;