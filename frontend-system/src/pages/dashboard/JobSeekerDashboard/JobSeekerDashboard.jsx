import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Send, 
  Eye, 
  Briefcase, 
  MapPin, 
  DollarSign,
  Building2,
  Calendar,
  Clock,
  Search,
  User,
  Award,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Star,
  Bell
} from 'lucide-react';
import api from '../../../services/api';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalApplications: 0,
    aiMatchScore: 75,
    profileViews: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [detailedScore, setDetailedScore] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📊 Fetching dashboard data...');

      // Fetch all data in parallel
      const [statsResponse, jobsResponse, profileResponse] = await Promise.all([
        api.get('/applications/stats'),
        api.get('/jobs?limit=6'),
        api.get('/users/profile')
      ]);

      // Debug raw responses
      console.log("Raw statsResponse:", statsResponse.data);
      console.log("Raw jobsResponse:", jobsResponse.data);
      console.log("Raw profileResponse:", profileResponse.data);

      const applicationStats = statsResponse.data.stats || {};
      const jobs = jobsResponse.data.jobs || [];
      const userData = profileResponse.data.user || profileResponse.data;
      const userProfile = userData.profile || {};

      console.log("✅ Parsed userProfile:", userProfile);
      console.log("✅ Sample job object:", jobs[0]);

      const totalApps = applicationStats.totalApplications || 0;

      // Skills %
      const skillsCount = Array.isArray(userProfile.skills) ? userProfile.skills.length : 0;
      let skillsPercentage = 0;
      if (skillsCount >= 5) skillsPercentage = 100;
      else if (skillsCount === 4) skillsPercentage = 80;
      else if (skillsCount === 3) skillsPercentage = 60;
      else if (skillsCount >= 1) skillsPercentage = 50;

      console.log("🔧 Skills calculation:", { skillsCount, skillsPercentage });

      // Education %
      const educationLevel = userProfile.educationLevel || '';
      let educationPercentage = 0;
      if (educationLevel.toLowerCase().includes('phd')) educationPercentage = 100;
      else if (educationLevel.toLowerCase().includes('master')) educationPercentage = 80;
      else if (educationLevel.toLowerCase().includes('bachelor')) educationPercentage = 60;
      else if (educationLevel.toLowerCase().includes('high school')) educationPercentage = 40;
      else if (educationLevel) educationPercentage = 20;

      console.log("🔧 Education calculation:", { educationLevel, educationPercentage });

      // Profile completeness %
      const calculateProfileCompleteness = (profileData) => {
        if (!profileData) return 0;
        const profile = profileData.profile || {};
        let score = 0;
        let totalPossible = 0;
        if (profile.firstName) { score += 10; totalPossible += 10; }
        if (profile.lastName) { score += 10; totalPossible += 10; }
        if (profile.bio) { score += 15; totalPossible += 15; }
        if (profile.location) { score += 10; totalPossible += 10; }
        if (profile.phone) { score += 10; totalPossible += 10; }
        if (profile.profilePicture) { score += 5; totalPossible += 5; }
        if (profile.experienceLevel) { score += 10; totalPossible += 10; }
        if (profile.educationLevel) { score += 10; totalPossible += 10; }
        if (profile.skills && profile.skills.length > 0) { score += 10; totalPossible += 10; }
        if (profile.experience && profile.experience.length > 0) { score += 10; totalPossible += 10; }
        if (profile.education && profile.education.length > 0) { score += 10; totalPossible += 10; }
        return totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
      };

      const profileCompletionPercentage = calculateProfileCompleteness(userData);
      console.log("🔧 Profile completion:", profileCompletionPercentage + "%");

      // Final AI Match Score
      const finalMatchScore = Math.round(
        (skillsPercentage * 0.25) +
        (educationPercentage * 0.25) +
        (profileCompletionPercentage * 0.50)
      );

      console.log("🎯 AI Match Score:", finalMatchScore);

      // Per-job match calculation
      const calculateJobMatch = (job, profile, educationPct, profilePct) => {
        const normalize = (s) => (s ? s.toLowerCase().trim() : "");

        const jobSkills = Array.isArray(job.skillsRequired)
          ? job.skillsRequired
          : Array.isArray(job.skills)
          ? job.skills
          : Array.isArray(job.requirements)
          ? job.requirements
          : [];

        const userSkills = Array.isArray(profile.skills)
          ? profile.skills
          : Array.isArray(profile.profile?.skills)
          ? profile.profile.skills
          : [];

        console.log("🔍 Comparing job:", job.title);
        console.log("   jobSkills:", jobSkills);
        console.log("   userSkills:", userSkills);

        let skillScore = 0;
        if (jobSkills.length > 0 && userSkills.length > 0) {
          const matched = jobSkills.filter((skill) =>
            userSkills.map(normalize).includes(normalize(skill))
          ).length;
          skillScore = Math.round((matched / jobSkills.length) * 100);
        }

        console.log("   skillScore:", skillScore);

        // Blend with education + profile completeness
        const finalScore = Math.round(
          (skillScore * 0.6) + (educationPct * 0.2) + (profilePct * 0.2)
        );

        console.log("   final job match score:", finalScore);

        return finalScore;
      };

      const jobsWithScore = jobs.map(job => ({
        ...job,
        matchScore: calculateJobMatch(job, userProfile, educationPercentage, profileCompletionPercentage),
        formattedSalary: job.salaryRange?.min && job.salaryRange?.max 
          ? `RWF ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
          : 'Salary not specified',
        postedDate: formatDaysAgo(job.createdAt),
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline',
        daysUntilDeadline: job.applicationDeadline ? 
          Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      }));

      setDetailedScore({
        breakdown: {
          skills: skillsPercentage,
          education: educationPercentage,
          profileCompleteness: profileCompletionPercentage
        },
        strengths: generateStrengths(userProfile, skillsCount, educationLevel),
        improvementAreas: generateImprovements(userProfile, skillsCount, educationLevel, profileCompletionPercentage),
        proficiencyLevel: getProficiencyLevel(finalMatchScore),
        aiMatchScore: finalMatchScore
      });

      setStats({
        totalApplications: totalApps,
        aiMatchScore: finalMatchScore,
        profileViews: userProfile.views || 0
      });

      setRecommendedJobs(jobsWithScore);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format date to "X days ago"
  const formatDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const generateStrengths = (profile, skillsCount, educationLevel) => {
    const strengths = [];
    if (skillsCount >= 3) strengths.push(`Strong in ${skillsCount} skills`);
    if (educationLevel.toLowerCase().includes('phd')) strengths.push('Doctoral-level education');
    else if (educationLevel.toLowerCase().includes('master')) strengths.push('Master\'s degree holder');
    else if (educationLevel.toLowerCase().includes('bachelor')) strengths.push('Bachelor\'s degree qualified');
    if (profile.bio && profile.bio.length > 50) strengths.push('Well-written profile summary');
    if (profile.profilePicture) strengths.push('Professional profile photo');
    if (strengths.length === 0) strengths.push('Quick learner', 'Adaptable', 'Good communication skills');
    return strengths.slice(0, 3);
  };

  const generateImprovements = (profile, skillsCount, educationLevel, profileCompletion) => {
    const improvements = [];
    if (skillsCount < 3) improvements.push(`Add ${3 - skillsCount} more skills to reach minimum`);
    if (!educationLevel || educationLevel.trim() === '') improvements.push('Add your education level for better matching');
    if (profileCompletion < 70) improvements.push('Complete your profile for better matching');
    if (!profile.profilePicture) improvements.push('Add a professional profile picture');
    if (!profile.bio || profile.bio.length < 50) improvements.push('Write a detailed bio (50+ characters)');
    if (improvements.length === 0) improvements.push('Keep profile updated', 'Network with professionals', 'Add certifications');
    return improvements.slice(0, 3);
  };

  const getProficiencyLevel = (score) => {
    if (score >= 80) return 'Expert';
    if (score >= 65) return 'Advanced';
    if (score >= 50) return 'Intermediate';
    if (score >= 30) return 'Developing';
    return 'Beginner';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#f59e0b';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getMatchScoreMessage = (score) => {
    if (score >= 80) return 'Excellent match rate!';
    if (score >= 65) return 'Good compatibility';
    if (score >= 50) return 'Average matching';
    return 'Complete your profile to improve';
  };

  // Container Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    minHeight: 'calc(100vh - 100px)',
    backgroundColor: '#f8fafc',
  };

  // Header Styles
  const headerStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '1.5rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 115, 230, 0.2)',
  };

  const headerContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  // Stats Grid Styles
  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  // Stat Card Styles
  const statCardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const highlightCardStyle = {
    ...statCardStyle,
    background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
    border: '1px solid #e0f2fe',
  };

  const statIconStyle = {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  };

  const statContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const statValueStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
  };

  // Button Styles
  const actionBtnStyle = {
    background: 'transparent',
    color: '#0073e6',
    border: '1px solid #0073e6',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  };

  const improveBtnStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  };

  // Mini Breakdown Styles
  const miniBreakdownStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  };

  const breakdownRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#6b7280',
  };

  const breakdownValueStyle = {
    fontWeight: '600',
    color: '#1e293b',
  };

  // Recommendation Card Styles
  const recommendationCardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const viewAllBtnStyle = {
    background: 'transparent',
    color: '#0073e6',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  // Recommendation List Styles
  const recommendationListStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  };

  const recommendationItemStyle = {
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const jobHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  };

  const jobMatchBadgeStyle = (score) => ({
    background: getMatchScoreColor(score) + '20',
    color: getMatchScoreColor(score),
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
  });

  const companyInfoStyle = {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
  };

  const jobMetaStyle = {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  };

  const jobTypeStyle = {
    background: '#eff6ff',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
  };

  const salaryStyle = {
    background: '#f0fdf4',
    color: '#15803d',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
  };

  const jobSkillsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.75rem',
  };

  const skillTagStyle = {
    background: '#f3e8ff',
    color: '#7c3aed',
    padding: '0.125rem 0.5rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '500',
  };

  // Tips Card Styles
  const tipsCardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const tipsListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  };

  const tipItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  };

  const tipIconStyle = {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  };

  const tipContentStyle = {
    flex: 1,
  };

  // Banner Styles
  const bannerStyle = {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #fbbf24',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const bannerContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const bannerIconStyle = {
    width: '48px',
    height: '48px',
    background: '#fbbf24',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  };

  const bannerBtnStyle = {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    flexShrink: 0,
  };

  const successBannerStyle = {
    ...bannerStyle,
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    border: '1px solid #10b981',
  };

  const successBannerIconStyle = {
    ...bannerIconStyle,
    background: '#10b981',
  };

  const successBannerBtnStyle = {
    ...bannerBtnStyle,
    background: '#059669',
  };

  // Dashboard Actions Styles
  const dashboardActionsStyle = {
    marginTop: '1.5rem',
  };

  const actionCardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
  };

  const actionButtonsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginTop: '1rem',
  };

  const actionButtonPrimaryStyle = {
    background: 'linear-gradient(135deg, #0073e6 0%, #9333ea 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  };

  const actionButtonSecondaryStyle = {
    ...actionButtonPrimaryStyle,
    background: 'white',
    color: '#0073e6',
    border: '2px solid #0073e6',
  };

  const actionButtonTertiaryStyle = {
    ...actionButtonPrimaryStyle,
    background: 'white',
    color: '#10b981',
    border: '2px solid #10b981',
  };

  const actionButtonSpecialStyle = {
    ...actionButtonPrimaryStyle,
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    color: 'white',
  };

  // Loading Spinner
  const spinnerStyle = {
    width: '3rem',
    height: '3rem',
    border: '3px solid #f3f4f6',
    borderTopColor: '#0073e6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '2rem auto',
  };

  // Error State
  const errorStateStyle = {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '1rem',
    color: '#dc2626',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  // Add spin animation
  const styleTag = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={containerStyle}>
      {/* Add animation styles */}
      <style>{styleTag}</style>
      
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
              Welcome back, {user?.profile?.firstName || user?.email?.split('@')[0] || 'Job Seeker'}!
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
              Your AI-powered job search dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={errorStateStyle}>
          <span>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>Note:</strong> {error}
            <button 
              onClick={fetchDashboardData}
              style={{
                marginLeft: '1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        {/* AI Match Score Card */}
        <div style={highlightCardStyle}>
          <div style={statIconStyle}>
            <Target size={24} />
          </div>
          <div style={statContentStyle}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>AI Match Score</h3>
            <div style={{...statValueStyle, color: getMatchScoreColor(stats.aiMatchScore)}}>
              {loading ? '...' : `${stats.aiMatchScore}%`}
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              {loading ? 'Calculating...' : getMatchScoreMessage(stats.aiMatchScore)}
            </p>

            {!loading && stats.aiMatchScore < 80 && (
              <button
                style={improveBtnStyle}
                onClick={() => navigate('/profile')}
              >
                {stats.aiMatchScore < 60 ? '🚀 Boost Score' : '📈 Improve Score'}
              </button>
            )}

            {!loading && detailedScore && (
              <button
                style={actionBtnStyle}
                onClick={() => setShowDetails((s) => !s)}
              >
                {showDetails ? 'Hide Details' : 'View Match Details'}
              </button>
            )}

            {/* Mini breakdown */}
            {!loading && !showDetails && detailedScore && (
              <div style={miniBreakdownStyle}>
                <div style={breakdownRowStyle}>
                  <span>Skills:</span>
                  <span style={breakdownValueStyle}>
                    {Math.round(detailedScore.breakdown?.skills || 0)}%
                  </span>
                </div>
                <div style={breakdownRowStyle}>
                  <span>Education:</span>
                  <span style={breakdownValueStyle}>
                    {Math.round(detailedScore.breakdown?.education || 0)}%
                  </span>
                </div>
                <div style={breakdownRowStyle}>
                  <span>Profile Complete:</span>
                  <span style={breakdownValueStyle}>
                    {Math.round(detailedScore.breakdown?.profileCompleteness || 0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applications Card */}
        <div style={statCardStyle}>
          <div style={statIconStyle}>
            <Send size={24} />
          </div>
          <div style={statContentStyle}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Applications</h3>
            <div style={statValueStyle}>{loading ? '...' : stats.totalApplications}</div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              Total applications sent
            </p>
            {!loading && (
              <button 
                style={actionBtnStyle}
                onClick={() => stats.totalApplications === 0 ? navigate('/jobs') : navigate('/applications')}
              >
                {stats.totalApplications === 0 ? 'Start Applying →' : 'View Applications →'}
              </button>
            )}
          </div>
        </div>

        {/* Profile Views Card */}
        <div style={statCardStyle}>
          <div style={statIconStyle}>
            <Eye size={24} />
          </div>
          <div style={statContentStyle}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Profile Views</h3>
            <div style={statValueStyle}>{loading ? '...' : stats.profileViews}</div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              By employers this month
            </p>
            {!loading && (
              <button 
                style={actionBtnStyle}
                onClick={() => navigate('/profile')}
              >
                {stats.profileViews === 0 ? 'Boost Visibility →' : 'Optimize Profile →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div style={recommendationCardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} /> AI Recommended Jobs
          </h3>
          <button style={viewAllBtnStyle} onClick={() => navigate('/jobs')}>
            View All <ArrowRight size={16} />
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={spinnerStyle}></div>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>Finding your perfect matches...</p>
          </div>
        ) : recommendedJobs.length > 0 ? (
          <div style={recommendationListStyle}>
            {recommendedJobs.slice(0, 3).map((job) => (
              <div
                key={job._id || job.id}
                style={recommendationItemStyle}
                onClick={() => navigate(`/jobs/${job._id || job.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={jobHeaderStyle}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827', lineHeight: '1.3' }}>
                    {job.title}
                  </h4>
                  {job.matchScore !== undefined && (
                    <div style={jobMatchBadgeStyle(job.matchScore)}>
                      {job.matchScore}% Match
                    </div>
                  )}
                </div>
                <p style={companyInfoStyle}>
                  {job.companyName || job.company?.company?.name} • {job.location}
                </p>
                <div style={jobMetaStyle}>
                  <span style={jobTypeStyle}>{job.jobType || 'Full-time'}</span>
                  <span style={salaryStyle}>{job.formattedSalary}</span>
                </div>
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div style={jobSkillsStyle}>
                    {job.skillsRequired.slice(0, 3).map((skill, idx) => (
                      <span key={idx} style={skillTagStyle}>{skill}</span>
                    ))}
                    {job.skillsRequired.length > 3 && (
                      <span style={{...skillTagStyle, background: '#f3f4f6', color: '#6b7280'}}>
                        +{job.skillsRequired.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Complete your profile for personalized job matches
            </p>
            <small style={{ color: '#9ca3af', display: 'block', marginBottom: '1.5rem' }}>
              Add your skills, experience, and preferences to see jobs that match your profile
            </small>
            <button
              style={improveBtnStyle}
              onClick={() => navigate('/profile')}
            >
              Complete Profile
            </button>
          </div>
        )}
      </div>

      {/* Profile Tips Card */}
      <div style={tipsCardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={24} /> Profile Tips
          </h3>
        </div>
        <div style={tipsListStyle}>
          <div style={tipItemStyle}>
            <div style={tipIconStyle}>
              <Zap size={20} />
            </div>
            <div style={tipContentStyle}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#111827' }}>
                Boost Your Match Score
              </h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                Add at least 5 relevant skills to increase your AI match score by up to 30%
              </p>
            </div>
          </div>
          <div style={tipItemStyle}>
            <div style={tipIconStyle}>
              <Award size={20} />
            </div>
            <div style={tipContentStyle}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#111827' }}>
                Add Education Level
              </h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                Specify your highest education level for better job matching
              </p>
            </div>
          </div>
          <div style={tipItemStyle}>
            <div style={tipIconStyle}>
              <TrendingUp size={20} />
            </div>
            <div style={tipContentStyle}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#111827' }}>
                Complete Your Profile
              </h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                100% complete profiles receive 3x more interview invitations
              </p>
            </div>
          </div>
        </div>
        <button
          style={actionBtnStyle}
          onClick={() => navigate('/profile')}
        >
          Optimize My Profile
        </button>
      </div>

      {/* Improvement Banner */}
      {!loading && stats.aiMatchScore < 70 && (
        <div style={bannerStyle}>
          <div style={bannerContentStyle}>
            <div style={bannerIconStyle}>
              <Zap size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#92400e' }}>
                Boost Your AI Match Score from {stats.aiMatchScore}% to 80%+!
              </h4>
              <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
                Complete these quick actions to dramatically improve your job matches:
              </p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', color: '#92400e', fontSize: '0.9rem' }}>
                <li>Add 5+ skills to your profile</li>
                <li>Specify your education level</li>
                <li>Write a compelling bio (100+ characters)</li>
                <li>Add your work experience</li>
              </ul>
            </div>
          </div>
          <button
            style={bannerBtnStyle}
            onClick={() => navigate('/profile')}
          >
            Improve Now
          </button>
        </div>
      )}

      {/* Success Banner */}
      {!loading && stats.aiMatchScore >= 70 && (
        <div style={successBannerStyle}>
          <div style={bannerContentStyle}>
            <div style={successBannerIconStyle}>
              <CheckCircle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#065f46' }}>
                Great Job! Your AI Match Score is {stats.aiMatchScore}%
              </h4>
              <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem' }}>
                You're well-positioned for great opportunities. Keep your profile updated and start applying!
              </p>
            </div>
          </div>
          <button
            style={successBannerBtnStyle}
            onClick={() => navigate('/jobs')}
          >
            Browse Matching Jobs
          </button>
        </div>
      )}

      {/* Dashboard Actions Section */}
      <div style={dashboardActionsStyle}>
        <div style={actionCardStyle}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Quick Actions</h3>
          <div style={actionButtonsStyle}>
            <button
              style={actionButtonPrimaryStyle}
              onClick={() => navigate('/jobs')}
            >
              <Search size={20} /> Browse Jobs
            </button>
            <button
              style={actionButtonSecondaryStyle}
              onClick={() => navigate('/applications')}
            >
              <Briefcase size={20} /> My Applications
            </button>
            <button
              style={actionButtonTertiaryStyle}
              onClick={() => navigate('/profile')}
            >
              <User size={20} /> Update Profile
            </button>
            <button
              style={actionButtonSpecialStyle}
              onClick={() => navigate('/jobs/saved')}
            >
              <Bell size={20} /> Saved Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;