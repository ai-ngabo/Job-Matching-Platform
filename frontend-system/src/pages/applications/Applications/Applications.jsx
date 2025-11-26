import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import ApplicationsJobSeeker from '../ApplicationsJobSeeker/ApplicationsJobSeeker';
import ApplicationsCompany from '../ApplicationsCompany/ApplicationsCompany';

const Applications = () => {
  const { user } = useAuth();

  if (user?.userType === 'company') {
    return <ApplicationsCompany />;
  }

  return <ApplicationsJobSeeker />;
};

export default Applications;