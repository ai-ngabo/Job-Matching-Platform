import api from './api';

const calculateOptimisticCompleteness = (user, isCompany = false) => {
  if (!user) return 0;
  
  if (isCompany) {
    return calculateCompanyCompleteness(user);
  }
  
  const profile = user.profile || {};
  
  // Check if all major fields are filled
  const hasEssentialInfo = profile.firstName && profile.lastName && profile.email;
  const hasProfessionalInfo = profile.bio && profile.skills && profile.skills.length > 0;
  const hasContactInfo = profile.phone || profile.location;
  
  // If all essential info is present, return 100%
  if (hasEssentialInfo && hasProfessionalInfo && hasContactInfo) {
    console.log('✅ Profile appears complete, returning 100%');
    return 100;
  }
  
  // Otherwise calculate normally
  return calculateJobSeekerCompleteness(user);
};

export const profileService = {
  // Calculate profile completeness (now the single source of truth)
  calculateCompleteness: (user, isCompany = false) => {
    if (!user) return 0;
    
    if (isCompany) {
      return calculateCompanyCompleteness(user);
    }
    return calculateJobSeekerCompleteness(user);
  },

  // Fetch completeness from backend
  getCompleteness: async () => {
    try {
      const response = await api.get('/users/profile/completeness');
      return response.data.completeness || 0;
    } catch (error) {
      console.error('Error fetching profile completeness:', error);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isCompany = user?.userType === 'company';
      return calculateJobSeekerCompleteness(user);
    }
  },

  // NEW: Calculate detailed score breakdown for dashboard
  // NEW: accepts optional `jobs` to allow qualification matching against job listings
  calculateDetailedScore: (user, applications = [], jobs = []) => {
    const profile = user?.profile || {};
    const isCompany = user?.userType === 'company';
    
    if (isCompany) {
      return calculateCompanyDetailedScore(user);
    }
    
    return calculateJobSeekerDetailedScore(profile, applications, jobs);
  }
};

// ========== JOB SEEKER SCORING ==========

const calculateJobSeekerCompleteness = (user) => {
  const profile = user?.profile || {};
  let score = 0;
  
  // Maximum points: 100
  console.log('🔍 Calculating completeness for:', profile.firstName, profile.lastName);

  // Personal Info (40 points - more lenient)
  if (profile.firstName) score += 15;
  if (profile.lastName) score += 15;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;

  // Professional Info (40 points - more lenient)
  if (profile.bio) {
    if (profile.bio.length > 30) score += 15; // Reduced from 50 chars
    else score += 10; // Partial points for having any bio
  }
  
  if (profile.skills) {
    if (profile.skills.length >= 2) score += 10; // Reduced from 3 skills
    else if (profile.skills.length >= 1) score += 5; // Partial points
  }
  
  if (profile.experienceLevel) score += 7.5;
  if (profile.educationLevel) score += 7.5;

  // Documents (15 points - optional for now)
  if (profile.documents?.cv?.url) score += 10; // Reduced from 15
  if (profile.documents?.idDocument?.url) score += 5;

  // Profile Media (5 points - optional)
  if (profile.avatar) score += 5; // Reduced from 10

  const finalScore = Math.min(100, score);
  console.log('📊 Final completeness score:', finalScore);
  
  // If score is close to 100, round it up
  if (finalScore >= 95) {
    console.log('🎯 Rounding up to 100% (close enough!)');
    return 100;
  }
  
  return finalScore;
};

// Enhanced scoring for dashboard with more realistic weights
const calculateJobSeekerDetailedScore = (profile, applications = [], jobs = []) => {
  // New scoring per user's requested weights:
  // - Profile completeness: 30%
  // - Skills (having >3 skills): 20%
  // - Education level: 15%
  // - Experience level: 15%
  // - Qualifications match with job(s): 20%

  const breakdown = {
    profileCompleteness: 0,
    skills: 0,
    education: 0,
    experience: 0,
    qualificationsMatch: 0
  };

  // 1) Profile completeness: reuse enhanced completeness (0-100)
  breakdown.profileCompleteness = calculateEnhancedProfileCompleteness(profile);

  // 2) Skills: normalized score where >=4 skills -> 100, fewer -> scaled
  const skills = profile.skills || [];
  if (skills.length >= 4) breakdown.skills = 100;
  else breakdown.skills = Math.round((skills.length / 4) * 100);

  // 3) Education level mapping (scale to 0-100)
  const EDU_MAP = { 'high-school': 20, 'diploma': 40, 'bachelors': 60, 'masters': 80, 'phd': 95 };
  breakdown.education = EDU_MAP[profile.educationLevel] || 0;

  // 4) Experience level mapping (entry/mid/senior/executive)
  const EXP_MAP = { 'entry': 20, 'mid': 50, 'senior': 80, 'executive': 95 };
  breakdown.experience = EXP_MAP[profile.experienceLevel] || 20;

  // 5) Qualifications match with provided jobs: compute average skill overlap % or education match
  // If no jobs provided, fall back to 50 (neutral)
  if (!Array.isArray(jobs) || jobs.length === 0) {
    breakdown.qualificationsMatch = 50;
  } else {
    // For each job, compute overlap between profile.skills and job.skills (as a percent)
    const jobMatches = jobs.map(job => {
      const jobSkills = (job.skills || job.skillsRequired || []).map(s => (s || '').toString().toLowerCase().trim());
      if (jobSkills.length === 0) return 0;
      const overlap = skills.filter(s => jobSkills.includes(s.toLowerCase().trim())).length;
      return Math.round((overlap / jobSkills.length) * 100);
    });
    // average
    const avgMatch = jobMatches.reduce((a, b) => a + b, 0) / (jobMatches.length || 1);
    breakdown.qualificationsMatch = Math.round(avgMatch);
  }

  // Compose weighted final score
  const weightedScore = (
    (breakdown.profileCompleteness * 0.30) +
    (breakdown.skills * 0.20) +
    (breakdown.education * 0.15) +
    (breakdown.experience * 0.15) +
    (breakdown.qualificationsMatch * 0.20)
  );

  const aiMatchScore = Math.min(100, Math.round(weightedScore));

  // Strengths & improvements derived simplistically from breakdown
  const strengths = [];
  const improvements = [];

  if (breakdown.profileCompleteness >= 80) strengths.push('Profile completeness');
  if (breakdown.skills >= 75) strengths.push('Skills breadth');
  if (breakdown.experience >= 70) strengths.push('Relevant experience');
  if (breakdown.education >= 70) strengths.push('Education level');

  if (breakdown.profileCompleteness < 80) improvements.push('Complete your profile: add bio, documents, and links');
  if (breakdown.skills < 50) improvements.push('Add more skills (aim for at least 4 relevant skills)');
  if (breakdown.experience < 50) improvements.push('Gain more hands-on experience or highlight projects');
  if (breakdown.education < 50) improvements.push('Consider further relevant certifications or education');
  if (breakdown.qualificationsMatch < 50) improvements.push('Improve skills that appear frequently in job listings you want');

  // Determine proficiency level based on overall score
  let proficiencyLevel = 'Beginner';
  if (aiMatchScore >= 80) proficiencyLevel = 'Expert';
  else if (aiMatchScore >= 65) proficiencyLevel = 'Advanced';
  else if (aiMatchScore >= 50) proficiencyLevel = 'Intermediate';

  return {
    aiMatchScore,
    proficiencyLevel,
    breakdown,
    strengths: strengths.slice(0, 4),
    improvementAreas: improvements.slice(0, 4)
  };
};

// Enhanced Profile Completeness (more detailed)
const calculateEnhancedProfileCompleteness = (profile) => {
  let score = 0;
  
  // Basic Info (40 points)
  if (profile.firstName && profile.lastName) score += 20;
  if (profile.email) score += 10;
  if (profile.phone) score += 10;
  if (profile.location) score += 10;
  
  // Professional Info (40 points)
  if (profile.bio) {
    if (profile.bio.length > 200) score += 20;
    else if (profile.bio.length > 50) score += 15;
    else score += 5;
  }
  if (profile.skills) {
    if (profile.skills.length >= 10) score += 15;
    else if (profile.skills.length >= 5) score += 10;
    else if (profile.skills.length >= 3) score += 5;
  }
  
  // Documents (20 points)
  if (profile.documents?.cv?.url) score += 15;
  if (profile.documents?.idDocument?.url) score += 5;
  
  return Math.min(100, score);
};

// Enhanced Skill Strength (higher scores for good profiles)
const calculateEnhancedSkillStrength = (profile) => {
  const skills = profile.skills || [];
  if (skills.length === 0) return 0;
  
  let score = 0;
  
  // Number of skills (max 40 points)
  if (skills.length >= 15) score += 40;
  else if (skills.length >= 10) score += 35;
  else if (skills.length >= 7) score += 30;
  else if (skills.length >= 5) score += 25;
  else if (skills.length >= 3) score += 20;
  else score += 10;
  
  // Skill relevance bonus (max 30 points)
  const highDemandSkills = [
    'python', 'javascript', 'java', 'react', 'node', 'angular', 'vue',
    'typescript', 'mongodb', 'postgresql', 'mysql', 'sql', 'aws',
    'azure', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'git',
    'agile', 'scrum', 'rest api', 'graphql', 'machine learning',
    'data analysis', 'ui/ux', 'figma', 'project management'
  ];
  
  const relevantSkills = skills.filter(skill => 
    highDemandSkills.includes(skill.toLowerCase().trim())
  ).length;
  
  if (relevantSkills >= 10) score += 30;
  else if (relevantSkills >= 7) score += 25;
  else if (relevantSkills >= 5) score += 20;
  else if (relevantSkills >= 3) score += 15;
  else if (relevantSkills >= 1) score += 10;
  
  // Skill diversity (max 30 points)
  const categories = {
    technical: ['python', 'javascript', 'java', 'react', 'node'],
    design: ['figma', 'ui', 'ux', 'photoshop'],
    management: ['project management', 'scrum', 'agile'],
    soft: ['communication', 'leadership', 'teamwork']
  };
  
  let categoryCount = 0;
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    Object.values(categories).forEach((catSkills, index) => {
      if (catSkills.some(catSkill => skillLower.includes(catSkill))) {
        categoryCount++;
      }
    });
  });
  
  if (categoryCount >= 4) score += 30;
  else if (categoryCount >= 3) score += 20;
  else if (categoryCount >= 2) score += 10;
  
  return Math.min(100, score);
};

// Enhanced Experience Score
const calculateEnhancedExperienceScore = (profile) => {
  const experienceLevel = profile.experienceLevel || 'entry';
  const EXPERIENCE_LEVELS = {
    'entry': 1,
    'mid': 2,
    'senior': 3,
    'executive': 4
  };
  
  const experiencePoints = EXPERIENCE_LEVELS[experienceLevel] || 1;
  
  // Base score from level (max 40 points)
  let score = (experiencePoints / 4) * 40;
  
  // Bonus for experience entries (max 30 points)
  const experiences = profile.experience || [];
  if (experiences.length > 0) {
    score += Math.min(30, experiences.length * 10);
  }
  
  // Bonus for years of experience if available (max 30 points)
  const totalYears = experiences.reduce((total, exp) => {
    const startYear = new Date(exp.startDate).getFullYear();
    const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
    return total + (endYear - startYear);
  }, 0);
  
  if (totalYears >= 10) score += 30;
  else if (totalYears >= 7) score += 25;
  else if (totalYears >= 5) score += 20;
  else if (totalYears >= 3) score += 15;
  else if (totalYears >= 1) score += 10;
  
  return Math.min(100, score);
};

// Enhanced Education Score
const calculateEnhancedEducationScore = (profile) => {
  const educationLevel = profile.educationLevel || 'high-school';
  const EDUCATION_LEVELS = {
    'high-school': 1,
    'diploma': 2,
    'bachelors': 3,
    'masters': 4,
    'phd': 5
  };
  
  const educationPoints = EDUCATION_LEVELS[educationLevel] || 1;
  
  // Base score from level (max 50 points)
  let score = (educationPoints / 5) * 50;
  
  // Bonus for education entries (max 30 points)
  const educations = profile.education || [];
  if (educations.length > 0) {
    score += Math.min(30, educations.length * 15);
  }
  
  // Bonus for top-tier institutions (max 20 points)
  const topInstitutions = ['harvard', 'stanford', 'mit', 'cambridge', 'oxford', 'princeton'];
  const hasTopInstitution = educations.some(edu => 
    topInstitutions.some(institution => 
      edu.institution?.toLowerCase().includes(institution)
    )
  );
  
  if (hasTopInstitution) score += 20;
  
  return Math.min(100, score);
};

// Enhanced Application Success
const calculateEnhancedApplicationSuccess = (applications) => {
  if (applications.length === 0) return 70; // Default score for no applications
  
  const successfulApplications = applications.filter(app => 
    ['shortlisted', 'interview', 'accepted'].includes(app.status)
  ).length;
  
  const successRate = (successfulApplications / applications.length) * 100;
  
  // Higher base score to encourage applications
  return Math.max(50, Math.min(100, successRate));
};

// Enhanced Extra Points
const calculateEnhancedExtraPoints = (profile) => {
  let points = 0;
  
  // Certifications (max 20 points)
  const certifications = profile.certifications || [];
  if (certifications.length >= 5) points += 20;
  else if (certifications.length >= 3) points += 15;
  else if (certifications.length >= 1) points += 10;
  
  // Portfolio/Projects (max 15 points)
  const projects = profile.projects || [];
  if (projects.length >= 5) points += 15;
  else if (projects.length >= 3) points += 10;
  else if (projects.length >= 1) points += 5;
  
  // LinkedIn/GitHub profiles (max 10 points)
  if (profile.linkedIn) points += 5;
  if (profile.github) points += 5;
  
  // Languages (max 15 points)
  const languages = profile.languages || [];
  if (languages.length >= 3) points += 15;
  else if (languages.length >= 2) points += 10;
  else if (languages.length >= 1) points += 5;
  
  return Math.min(50, points); // Cap at 50 extra points
};

// Generate strengths based on scores
const generateStrengths = (profile, breakdown) => {
  const strengths = [];
  const skills = profile.skills || [];
  
  // Based on breakdown scores
  if (breakdown.skillStrength >= 80) {
    strengths.push('Strong Technical Skills');
  } else if (breakdown.skillStrength >= 60) {
    strengths.push('Good Skill Diversity');
  }
  
  if (breakdown.experienceMatch >= 80) {
    strengths.push('Strong Experience Background');
  } else if (breakdown.experienceMatch >= 60) {
    strengths.push('Relevant Experience');
  }
  
  if (breakdown.educationMatch >= 80) {
    strengths.push('Strong Educational Background');
  } else if (breakdown.educationMatch >= 60) {
    strengths.push('Good Education Level');
  }
  
  if (breakdown.profileCompleteness >= 90) {
    strengths.push('Complete Professional Profile');
  }
  
  // Specific strengths based on profile
  if (skills.length >= 10) {
    strengths.push('Extensive Skill Set');
  } else if (skills.length >= 5) {
    strengths.push('Diverse Skills');
  }
  
  if (profile.experienceLevel === 'senior' || profile.experienceLevel === 'executive') {
    strengths.push('Leadership Experience');
  }
  
  if (profile.educationLevel === 'masters' || profile.educationLevel === 'phd') {
    strengths.push('Advanced Education');
  }
  
  if (profile.certifications?.length >= 2) {
    strengths.push('Professional Certifications');
  }
  
  // Fallback strengths
  if (strengths.length === 0) {
    strengths.push('Communication Skills', 'Problem Solving', 'Adaptability');
  }
  
  return strengths.slice(0, 4);
};

// Generate improvement areas
const generateImprovementAreas = (profile, breakdown) => {
  const improvements = [];
  
  // Based on breakdown scores
  if (breakdown.skillStrength < 70) {
    improvements.push('Develop More Technical Skills');
  }
  
  if (breakdown.experienceMatch < 70) {
    improvements.push('Gain More Relevant Experience');
  }
  
  if (breakdown.educationMatch < 70) {
    improvements.push('Consider Further Education');
  }
  
  if (breakdown.profileCompleteness < 80) {
    if (!profile.bio || profile.bio.length < 50) improvements.push('Write Detailed Bio');
    if (!profile.avatar) improvements.push('Add Professional Photo');
    if (!profile.skills || profile.skills.length < 5) improvements.push('Add More Skills');
  }
  
  if (!profile.documents?.cv?.url) {
    improvements.push('Upload Your CV');
  }
  
  if (!profile.certifications || profile.certifications.length === 0) {
    improvements.push('Get Professional Certifications');
  }
  
  if (!profile.projects || profile.projects.length === 0) {
    improvements.push('Add Portfolio Projects');
  }
  
  // Fallback improvements
  if (improvements.length === 0) {
    improvements.push('Network with Industry Professionals', 'Attend Career Events');
  }
  
  return improvements.slice(0, 4);
};

// ========== COMPANY SCORING ==========
const calculateCompanyCompleteness = (user) => {
  const company = user.company || {};
  let score = 0;

  // Company Info (40 points)
  if (company.name) score += 15;
  if (company.description && company.description.length > 50) score += 15;
  if (company.industry) score += 5;
  if (company.website) score += 5;

  // Contact Info (30 points)
  if (user.email) score += 10;
  if (company.contact?.email) score += 10;
  if (company.contact?.phone) score += 10;

  // Documents (20 points)
  if (company.documents?.registrationCertificate?.url) score += 10;
  if (company.documents?.taxCertificate?.url) score += 10;

  // Logo (10 points)
  if (company.logo) score += 10;

  return Math.min(100, score);
};

const calculateCompanyDetailedScore = (user) => {
  // Similar detailed scoring for companies
  return {
    aiMatchScore: calculateCompanyCompleteness(user),
    breakdown: {
      profileCompleteness: calculateCompanyCompleteness(user),
      skillStrength: 0,
      experienceMatch: 0,
      educationMatch: 0,
      applicationSuccess: 0,
      extraPoints: 0
    },
    strengths: ['Company Profile Complete', 'Professional Presence'],
    improvementAreas: ['Add More Company Details']
  };
};