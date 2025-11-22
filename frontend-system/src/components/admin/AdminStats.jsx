import React from 'react';

const AdminStats = ({ stats, loading }) => {
  if (loading) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div className="admin-stats">
      {/* Stats content handled in AdminDashboard */}
    </div>
  );
};

export default AdminStats;
