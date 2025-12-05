// AI scoring utilities used by multiple routes
export const calculateQualificationScore = (applicant, job) => {
  let score = 0;

  // Skills match (40 points)
  if (applicant.profile?.skills && job.skillsRequired && job.skillsRequired.length > 0) {
    const applicantSkills = applicant.profile.skills.map(s => s.toLowerCase());
    const requiredSkills = job.skillsRequired.map(s => s.toLowerCase());
    const matchedSkills = applicantSkills.filter(skill => 
      requiredSkills.some(req => req.includes(skill) || skill.includes(req))
    );
    const skillScore = (matchedSkills.length / (requiredSkills.length || 1)) * 40;
    score += skillScore;
  } else if (job.skillsRequired && job.skillsRequired.length > 0) {
    score += 0;
  } else {
    score += 40;
  }

  // Experience (35 points)
  if (applicant.profile?.experience) {
    const yearsExperience = applicant.profile.experience.length > 0
      ? applicant.profile.experience.reduce((total, exp) => {
          const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
          const startYear = new Date(exp.startDate).getFullYear();
          return total + (endYear - startYear);
        }, 0)
      : 0;

    const minExperience = job.experienceLevel === 'entry' ? 0 : 
                         job.experienceLevel === 'intermediate' ? 2 :
                         job.experienceLevel === 'senior' ? 5 : 0;

    if (minExperience === 0) {
      score += Math.min(35, (yearsExperience / 10) * 35);
    } else if (yearsExperience >= minExperience) {
      score += Math.min(35, (yearsExperience / 10) * 35);
    } else {
      score += (yearsExperience / (minExperience || 1)) * 25;
    }
  } else {
    score += 0;
  }

  // Education (15 points)
  if (applicant.profile?.education) {
    const educationLevel = applicant.profile.education[0]?.level || '';

    if (educationLevel.toLowerCase().includes('master') || educationLevel.toLowerCase().includes('phd')) {
      score += 15;
    } else if (educationLevel.toLowerCase().includes('bachelor')) {
      score += 10;
    } else if (educationLevel.toLowerCase().includes('diploma')) {
      score += 5;
    }
  } else {
    score += 0;
  }

  // CV uploaded (10 points)
  if (applicant.profile?.documents?.cv?.url) {
    score += 10;
  }

  return Math.min(score, 100);
};

export const calculateSkillsMatch = (applicant, job) => {
  if (!applicant.profile?.skills || !job.skillsRequired || job.skillsRequired.length === 0) {
    return 0;
  }

  const applicantSkills = applicant.profile.skills.map(s => s.toLowerCase());
  const requiredSkills = job.skillsRequired.map(s => s.toLowerCase());
  
  const matchedSkills = applicantSkills.filter(skill => 
    requiredSkills.some(req => req.includes(skill) || skill.includes(req))
  );

  return Math.round((matchedSkills.length / (requiredSkills.length || 1)) * 100);
};

export const calculateExperienceMatch = (applicant, job) => {
  if (!applicant.profile?.experience || applicant.profile.experience.length === 0) {
    return 0;
  }

  const yearsExperience = applicant.profile.experience.reduce((total, exp) => {
    const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
    const startYear = new Date(exp.startDate).getFullYear();
    return total + (endYear - startYear);
  }, 0);

  const minExperience = job.experienceLevel === 'entry' ? 0 : 
                       job.experienceLevel === 'intermediate' ? 2 :
                       job.experienceLevel === 'senior' ? 5 : 0;

  if (yearsExperience >= minExperience) {
    return Math.min(100, Math.round((yearsExperience / 10) * 100));
  } else if (minExperience > 0) {
    return Math.round((yearsExperience / minExperience) * 100);
  }
  
  return 100;
};

export const calculateEducationMatch = (applicant, job) => {
  if (!applicant.profile?.education || applicant.profile.education.length === 0) {
    return 0;
  }

  const educationLevel = applicant.profile.education[0]?.level || '';

  if (educationLevel.toLowerCase().includes('master') || educationLevel.toLowerCase().includes('phd')) {
    return 100;
  } else if (educationLevel.toLowerCase().includes('bachelor')) {
    return 85;
  } else if (educationLevel.toLowerCase().includes('diploma')) {
    return 60;
  } else if (educationLevel.toLowerCase().includes('high school')) {
    return 40;
  }
  
  return 50;
};
