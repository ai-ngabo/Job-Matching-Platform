import React, { useEffect, useState } from 'react';
import { Users, Mail, MapPin, Briefcase } from 'lucide-react';
import './AllJobSeekers.css';

const AllJobSeekers = () => {
  const [jobSeekers, setJobSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchJobSeekers();
  }, []);

  const fetchJobSeekers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/admin/jobseekers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job seekers');
      }

      const data = await response.json();
      setJobSeekers(data.jobSeekers);
    } catch (err) {
      console.error('Error fetching job seekers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="jobseekers-loading">Loading job seekers...</div>;
  }

  if (error) {
    return <div className="jobseekers-error">{error}</div>;
  }

  if (jobSeekers.length === 0) {
    return (
      <div className="jobseekers-empty">
        <Users size={48} />
        <p>No job seekers found</p>
      </div>
    );
  }

  return (
    <div className="all-jobseekers">
      <h2>Job Seekers ({jobSeekers.length})</h2>
      <div className="jobseekers-grid">
        {jobSeekers.map((seeker) => (
          <div key={seeker._id} className="jobseeker-card">
            <div className="jobseeker-avatar">
              {seeker.profile?.avatar ? (
                <img src={seeker.profile.avatar} alt={`${seeker.profile?.firstName} ${seeker.profile?.lastName}`} />
              ) : (
                <div className="avatar-placeholder">
                  {seeker.profile?.firstName?.charAt(0)}{seeker.profile?.lastName?.charAt(0)}
                </div>
              )}
            </div>

            <div className="jobseeker-content">
              <h3>
                {seeker.profile?.firstName} {seeker.profile?.lastName}
              </h3>
              <p className="jobseeker-email">
                <Mail size={14} />
                {seeker.email}
              </p>

              {seeker.profile?.location && (
                <p className="jobseeker-location">
                  <MapPin size={14} />
                  {seeker.profile.location}
                </p>
              )}

              {seeker.profile?.experienceLevel && (
                <p className="jobseeker-experience">
                  <Briefcase size={14} />
                  {seeker.profile.experienceLevel.charAt(0).toUpperCase() + seeker.profile.experienceLevel.slice(1)}
                </p>
              )}

              {seeker.profile?.bio && (
                <>
                  <button
                    className="expand-btn"
                    onClick={() => setExpandedId(expandedId === seeker._id ? null : seeker._id)}
                  >
                    {expandedId === seeker._id ? 'Show Less' : 'Show More'}
                  </button>

                  {expandedId === seeker._id && (
                    <div className="jobseeker-bio">
                      <p>{seeker.profile.bio}</p>

                      {seeker.profile?.skills && seeker.profile.skills.length > 0 && (
                        <div className="skills-section">
                          <h4>Skills</h4>
                          <div className="skills-list">
                            {seeker.profile.skills.map((skill, idx) => (
                              <span key={idx} className="skill-badge">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="profile-meta">
                        <div className="meta-item">
                          <span className="meta-label">Education</span>
                          <span className="meta-value">
                            {seeker.profile?.educationLevel
                              ? seeker.profile.educationLevel.charAt(0).toUpperCase() + seeker.profile.educationLevel.slice(1)
                              : 'Not specified'}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Registered</span>
                          <span className="meta-value">
                            {new Date(seeker.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllJobSeekers;
