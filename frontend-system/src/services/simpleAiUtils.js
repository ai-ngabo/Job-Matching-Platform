export const calculateQualificationScore = (applicant, job) => {
  console.log('🔧 SIMPLE AI CALCULATION STARTED');
  
  // Handle missing data gracefully
  const profile = applicant?.profile || {};
  const jobData = job || {};
  
  console.log('Profile data:', {
    hasProfile: !!applicant?.profile,
    skillsCount: profile.skills?.length || 0,
    experienceCount: profile.experience?.length || 0,
    educationCount: profile.education?.length || 0
  });
  
  console.log('Job data:', {
    title: jobData.title,
    skillsRequired: jobData.skillsRequired?.length || 0,
    experienceLevel: jobData.experienceLevel
  });
  
  // Start with a base score
  let score = 50; // Start at 50% instead of 0
  
  // 1. SKILLS MATCH (up to +30 points)
  const applicantSkills = profile.skills?.map(s => s.toLowerCase().trim()) || [];
  const requiredSkills = jobData.skillsRequired?.map(s => s.toLowerCase().trim()) || [];
  
  if (requiredSkills.length > 0 && applicantSkills.length > 0) {
    // Simple matching: count how many required skills the applicant has
    let matches = 0;
    for (const reqSkill of requiredSkills) {
      for (const appSkill of applicantSkills) {
        // Simple contains check
        if (appSkill.includes(reqSkill) || reqSkill.includes(appSkill)) {
          matches++;
          break;
        }
      }
    }
    
    const skillMatchPercent = (matches / requiredSkills.length) * 100;
    const skillBonus = (skillMatchPercent / 100) * 30; // Up to 30 points
    score += skillBonus;
    
    console.log(`Skills: ${matches}/${requiredSkills.length} matches = +${skillBonus.toFixed(1)} points`);
  } else if (requiredSkills.length === 0) {
    // If job has no specific skill requirements, give bonus
    score += 25;
    console.log('Skills: No requirements = +25 points');
  } else {
    // Applicant has no skills but job requires them
    score -= 10; // Small penalty
    console.log('Skills: Missing required skills = -10 points');
  }
  
  // 2. EXPERIENCE MATCH (up to +25 points)
  const experienceLevel = jobData.experienceLevel || 'entry';
  const yearsExperience = calculateTotalExperience(profile.experience || []);
  
  const experienceScore = calculateExperienceScore(experienceLevel, yearsExperience);
  score += experienceScore;
  console.log(`Experience: ${yearsExperience} years for ${experienceLevel} level = +${experienceScore} points`);
  
  // 3. EDUCATION MATCH (up to +15 points)
  const educationScore = calculateEducationScore(profile.education || []);
  score += educationScore;
  console.log(`Education: +${educationScore} points`);
  
  // 4. PROFILE COMPLETENESS BONUS (up to +10 points)
  const completenessBonus = calculateProfileCompletenessBonus(profile);
  score += completenessBonus;
  console.log(`Profile completeness: +${completenessBonus} points`);
  
  // Ensure score is between 40 and 100
  score = Math.max(40, Math.min(100, score));
  
  console.log(`🎯 FINAL SCORE: ${Math.round(score)}%`);
  return Math.round(score);
};

// Helper functions
const calculateTotalExperience = (experienceArray) => {
  if (!experienceArray || experienceArray.length === 0) return 0;
  
  let totalYears = 0;
  for (const exp of experienceArray) {
    try {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += Math.max(0, years);
    } catch (error) {
      // If date parsing fails, assume 1 year per entry
      totalYears += 1;
    }
  }
  
  return totalYears;
};

const calculateExperienceScore = (requiredLevel, yearsExperience) => {
  const levelRequirements = {
    'entry': 0,
    'junior': 1,
    'mid': 2,
    'intermediate': 3,
    'senior': 5,
    'executive': 8
  };
  
  const requiredYears = levelRequirements[requiredLevel.toLowerCase()] || 0;
  
  if (yearsExperience >= requiredYears) {
    return 25; // Full points
  } else if (yearsExperience > 0) {
    // Partial credit based on percentage of requirement met
    const percent = (yearsExperience / Math.max(1, requiredYears)) * 100;
    return Math.min(25, (percent / 100) * 20); // Up to 20 points
  }
  
  return 5; // Small base score even with no experience
};

const calculateEducationScore = (educationArray) => {
  if (!educationArray || educationArray.length === 0) return 5;
  
  const highestEducation = educationArray[0]?.level || '';
  const level = highestEducation.toLowerCase();
  
  if (level.includes('phd') || level.includes('doctorate')) return 15;
  if (level.includes('master') || level.includes('mba') || level.includes('msc')) return 12;
  if (level.includes('bachelor') || level.includes('bs') || level.includes('ba')) return 10;
  if (level.includes('diploma') || level.includes('associate')) return 8;
  if (level.includes('certificate') || level.includes('certification')) return 6;
  
  return 7; // Default for other education
};

const calculateProfileCompletenessBonus = (profile) => {
  let bonus = 0;
  
  if (profile.firstName && profile.lastName) bonus += 3;
  if (profile.bio && profile.bio.length > 50) bonus += 3;
  if (profile.skills && profile.skills.length >= 3) bonus += 2;
  if (profile.documents?.cv?.url) bonus += 2;
  
  return Math.min(10, bonus);
};

// Other functions for API compatibility
export const calculateSkillsMatch = (applicant, job) => {
  const profile = applicant?.profile || {};
  const applicantSkills = profile.skills?.map(s => s.toLowerCase().trim()) || [];
  const requiredSkills = job?.skillsRequired?.map(s => s.toLowerCase().trim()) || [];
  
  if (requiredSkills.length === 0) return 80;
  if (applicantSkills.length === 0) return 20;
  
  let matches = 0;
  for (const reqSkill of requiredSkills) {
    for (const appSkill of applicantSkills) {
      if (appSkill.includes(reqSkill) || reqSkill.includes(appSkill)) {
        matches++;
        break;
      }
    }
  }
  
  const percentage = (matches / requiredSkills.length) * 100;
  return Math.max(20, Math.min(100, Math.round(percentage)));
};

export const calculateExperienceMatch = (applicant, job) => {
  const profile = applicant?.profile || {};
  const experienceLevel = job?.experienceLevel || 'entry';
  const yearsExperience = calculateTotalExperience(profile.experience || []);
  
  return calculateExperienceScore(experienceLevel, yearsExperience) * 4; // Convert to percentage
};

export const calculateEducationMatch = (applicant, job) => {
  const profile = applicant?.profile || {};
  const educationArray = profile.education || [];
  
  if (educationArray.length === 0) return 30;
  
  const highestEducation = educationArray[0]?.level || '';
  const level = highestEducation.toLowerCase();
  
  if (level.includes('phd')) return 100;
  if (level.includes('master')) return 90;
  if (level.includes('bachelor')) return 80;
  if (level.includes('diploma')) return 60;
  if (level.includes('certificate')) return 50;
  
  return 70;
};