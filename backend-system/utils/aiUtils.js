// Improved AI scoring utilities with better matching algorithms
import natural from 'natural';
import { getEmbedding, calculateSimilarity } from './huggingfaceService.js';

// Initialize natural language processors
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;

// Preprocess text for better matching
const preprocessText = (text) => {
  if (!text) return '';
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(' ')
    .map(word => stemmer.stem(word)) // Stem words
    .join(' ');
};

// Semantic similarity using embeddings (if available)
const calculateSemanticSimilarity = async (text1, text2) => {
  try {
    const embedding1 = await getEmbedding(text1);
    const embedding2 = await getEmbedding(text2);
    return calculateSimilarity(embedding1, embedding2);
  } catch (error) {
    // Fall back to TF-IDF if embeddings fail
    return calculateTfIdfSimilarity(text1, text2);
  }
};

// TF-IDF similarity as fallback
const calculateTfIdfSimilarity = (text1, text2) => {
  const tfidf = new TfIdf();
  
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  let similarity = 0;
  tfidf.tfidfs(text1, (i, measure) => {
    if (i === 1) similarity = measure;
  });
  
  return Math.max(0, Math.min(1, (similarity + 1) / 2)); // Normalize to 0-1
};

// Skill similarity with fuzzy matching
const skillSimilarity = (skill1, skill2) => {
  skill1 = skill1.toLowerCase().trim();
  skill2 = skill2.toLowerCase().trim();
  
  // Direct match
  if (skill1 === skill2) return 1.0;
  
  // Contains match
  if (skill1.includes(skill2) || skill2.includes(skill1)) return 0.9;
  
  // Stemmed match
  const stemmed1 = stemmer.stem(skill1);
  const stemmed2 = stemmer.stem(skill2);
  if (stemmed1 === stemmed2) return 0.8;
  
  // Common variations (e.g., React vs React.js)
  const skillVariations = {
    'react': ['react.js', 'reactjs', 'react native'],
    'javascript': ['js', 'ecmascript'],
    'python': ['py', 'python3'],
    'node': ['node.js', 'nodejs'],
    'angular': ['angular.js', 'angularjs'],
    'vue': ['vue.js', 'vuejs'],
    'mongodb': ['mongo'],
    'postgresql': ['postgres'],
    'aws': ['amazon web services'],
    'azure': ['microsoft azure'],
    'gcp': ['google cloud'],
    'typescript': ['ts'],
    'html': ['html5'],
    'css': ['css3', 'scss', 'sass'],
    'docker': ['docker container'],
    'kubernetes': ['k8s'],
    'machine learning': ['ml', 'ai'],
    'deep learning': ['dl'],
    'data science': ['datascience'],
    'ui/ux': ['user interface', 'user experience'],
    'devops': ['development operations'],
    'ci/cd': ['continuous integration', 'continuous deployment'],
    'rest api': ['restful api', 'rest'],
    'graphql': ['gql'],
    'sql': ['structured query language'],
    'nosql': ['non-relational'],
    'agile': ['scrum', 'kanban'],
    'project management': ['pm'],
    'version control': ['git']
  };
  
  // Check variations
  for (const [base, variations] of Object.entries(skillVariations)) {
    if ((skill1 === base || variations.includes(skill1)) && 
        (skill2 === base || variations.includes(skill2))) {
      return 0.85;
    }
  }
  
  // Use Jaro-Winkler distance for fuzzy matching
  const distance = natural.JaroWinklerDistance(skill1, skill2);
  return distance > 0.8 ? distance : 0;
};

export const calculateQualificationScore = async (applicant, job) => {
  let totalScore = 0;
  const weights = {
    skills: 40,      // Increased from 40
    experience: 30,  // Reduced from 35
    education: 20,   // Increased from 15
    location: 5,     // New
    salary: 5,       // New
    documents: 10    // Same as before (CV)
  };

  // 1. SKILLS MATCHING (Improved) - 40 points
  const skillsScore = await calculateSkillsMatch(applicant, job);
  totalScore += (skillsScore / 100) * weights.skills;

  // 2. EXPERIENCE MATCHING (Improved) - 30 points
  const experienceScore = calculateExperienceMatch(applicant, job);
  totalScore += (experienceScore / 100) * weights.experience;

  // 3. EDUCATION MATCHING (Improved) - 20 points
  const educationScore = calculateEducationMatch(applicant, job);
  totalScore += (educationScore / 100) * weights.education;

  // 4. LOCATION MATCHING - 5 points (New)
  const locationScore = calculateLocationMatch(applicant, job);
  totalScore += locationScore * weights.location;

  // 5. SALARY EXPECTATIONS MATCH - 5 points (New)
  const salaryScore = calculateSalaryMatch(applicant, job);
  totalScore += salaryScore * weights.salary;

  // 6. DOCUMENTS/CV - 10 points
  if (applicant.profile?.documents?.cv?.url) {
    totalScore += weights.documents;
  }

  // Add bonus points for strong matches
  const bonusPoints = calculateBonusPoints(applicant, job);
  totalScore = Math.min(totalScore + bonusPoints, 100);

  return Math.round(totalScore);
};

export const calculateSkillsMatch = async (applicant, job) => {
  if (!applicant.profile?.skills || !job.skillsRequired || job.skillsRequired.length === 0) {
    return job.skillsRequired?.length === 0 ? 80 : 0; // Bonus if no skills required
  }

  const applicantSkills = applicant.profile.skills.map(s => s.toLowerCase().trim());
  const requiredSkills = job.skillsRequired.map(s => s.toLowerCase().trim());
  
  // Use semantic matching if embeddings available
  if (applicantSkills.length > 0 && requiredSkills.length > 0) {
    try {
      const skillText1 = applicantSkills.join(' ');
      const skillText2 = requiredSkills.join(' ');
      const semanticScore = await calculateSemanticSimilarity(skillText1, skillText2);
      
      if (semanticScore > 0.3) {
        return Math.round(semanticScore * 100);
      }
    } catch (error) {
      // Fall back to skill-by-skill matching
    }
  }

  // Calculate matching with fuzzy matching
  let totalSimilarity = 0;
  let matchesFound = 0;

  for (const requiredSkill of requiredSkills) {
    let bestMatch = 0;
    
    for (const applicantSkill of applicantSkills) {
      const similarity = skillSimilarity(applicantSkill, requiredSkill);
      if (similarity > bestMatch) {
        bestMatch = similarity;
      }
    }
    
    if (bestMatch > 0.6) { // Threshold for considering it a match
      totalSimilarity += bestMatch;
      matchesFound++;
    }
  }

  // Calculate score
  const coverage = requiredSkills.length > 0 ? matchesFound / requiredSkills.length : 0;
  const averageSimilarity = matchesFound > 0 ? totalSimilarity / matchesFound : 0;
  
  // Weighted score: 70% coverage + 30% similarity
  const score = (coverage * 0.7 + averageSimilarity * 0.3) * 100;
  
  // Ensure minimum 30% if applicant has any skills and job requires skills
  if (applicantSkills.length > 0 && requiredSkills.length > 0 && score < 30) {
    return 30;
  }
  
  return Math.round(score);
};

export const calculateExperienceMatch = (applicant, job) => {
  if (!applicant.profile?.experience || applicant.profile.experience.length === 0) {
    return job.experienceLevel === 'entry' ? 60 : 20; // Entry level more forgiving
  }

  const yearsExperience = applicant.profile.experience.reduce((total, exp) => {
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    const startDate = new Date(exp.startDate);
    const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
    return total + years;
  }, 0);

  const minExperience = job.experienceLevel === 'entry' ? 0 :
                       job.experienceLevel === 'intermediate' ? 2 :        
                       job.experienceLevel === 'senior' ? 5 : 0;

  // Non-linear scoring - being close to requirement still scores well
  if (yearsExperience >= minExperience) {
    // Cap at 5+ years for scoring purposes
    const effectiveYears = Math.min(yearsExperience, 10);
    const experienceRatio = effectiveYears / 10;
    
    // Curve: 0-2 years: 60-80%, 2-5: 80-95%, 5+: 95-100%
    if (effectiveYears <= 2) {
      return Math.round(60 + (experienceRatio * 20));
    } else if (effectiveYears <= 5) {
      return Math.round(80 + ((effectiveYears - 2) / 3) * 15);
    } else {
      return Math.round(95 + ((effectiveYears - 5) / 5) * 5);
    }
  } else if (minExperience > 0) {
    // Partial credit for being close
    const ratio = yearsExperience / minExperience;
    
    if (ratio >= 0.8) return 75; // 80-99% of required
    if (ratio >= 0.6) return 60; // 60-79% of required
    if (ratio >= 0.4) return 45; // 40-59% of required
    if (ratio >= 0.2) return 30; // 20-39% of required
    return 20; // Less than 20%
  }

  return 100; // No experience required
};

export const calculateEducationMatch = (applicant, job) => {
  if (!applicant.profile?.education || applicant.profile.education.length === 0) {
    return 40; // Some credit even without listed education
  }

  const educationLevel = (applicant.profile.education[0]?.level || '').toLowerCase();
  const fieldOfStudy = (applicant.profile.education[0]?.field || '').toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  const jobDescription = (job.description || '').toLowerCase();

  let baseScore = 50;
  
  // Education level scoring
  if (educationLevel.includes('phd')) baseScore = 100;
  else if (educationLevel.includes('master') || educationLevel.includes('msc') || educationLevel.includes('mba')) baseScore = 90;
  else if (educationLevel.includes('bachelor') || educationLevel.includes('bs') || educationLevel.includes('ba')) baseScore = 80;
  else if (educationLevel.includes('associate') || educationLevel.includes('diploma')) baseScore = 70;
  else if (educationLevel.includes('certificate') || educationLevel.includes('certification')) baseScore = 60;
  else if (educationLevel.includes('high school')) baseScore = 50;

  // Field of study relevance bonus (up to +20 points)
  let fieldBonus = 0;
  if (fieldOfStudy) {
    const relevantKeywords = [
      'computer', 'software', 'engineering', 'technology', 'information',
      'data', 'science', 'math', 'statistics', 'business', 'management',
      'design', 'arts', 'medicine', 'health', 'finance', 'accounting'
    ];
    
    // Check if field is relevant to job
    const isRelevant = relevantKeywords.some(keyword => 
      fieldOfStudy.includes(keyword) || 
      jobTitle.includes(keyword) || 
      jobDescription.includes(keyword)
    );
    
    if (isRelevant) {
      fieldBonus = 15;
      
      // Extra bonus for exact field match
      if (jobDescription.includes(fieldOfStudy) || fieldOfStudy.includes(jobTitle)) {
        fieldBonus = 20;
      }
    }
  }

  // Recent graduation bonus (graduated within 3 years)
  if (applicant.profile.education[0]?.endDate) {
    const graduationDate = new Date(applicant.profile.education[0].endDate);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    if (graduationDate > threeYearsAgo) {
      fieldBonus += 5;
    }
  }

  return Math.min(100, baseScore + fieldBonus);
};

// NEW: Location matching
export const calculateLocationMatch = (applicant, job) => {
  const applicantLocation = applicant.profile?.location || '';
  const jobLocation = job.location || '';
  
  if (!applicantLocation || !jobLocation) return 0.5; // Neutral if unknown
  
  const loc1 = applicantLocation.toLowerCase();
  const loc2 = jobLocation.toLowerCase();
  
  if (loc1 === loc2) return 1.0;
  
  // Check for remote/onsite
  if (job.locationType === 'remote') return 0.8;
  if (loc1.includes('remote') || loc2.includes('remote')) return 0.7;
  
  // Check for same city/region
  if (loc1.includes(loc2) || loc2.includes(loc1)) return 0.9;
  
  // Check for same country
  const countries = ['rwanda', 'kenya', 'uganda', 'tanzania', 'burundi'];
  const applicantCountry = countries.find(c => loc1.includes(c));
  const jobCountry = countries.find(c => loc2.includes(c));
  
  if (applicantCountry && jobCountry && applicantCountry === jobCountry) {
    return 0.6;
  }
  
  return 0.3; // Different locations
};

// NEW: Salary expectations match
export const calculateSalaryMatch = (applicant, job) => {
  const expectedSalary = applicant.profile?.expectedSalary || 0;
  const jobSalary = job.salaryRange?.min || job.salary || 0;
  
  if (!expectedSalary || !jobSalary || jobSalary === 0) return 0.5;
  
  const ratio = expectedSalary / jobSalary;
  
  if (ratio <= 1.0 && ratio >= 0.8) return 1.0; // Within 20% below or exact
  if (ratio <= 1.2 && ratio >= 0.6) return 0.7; // Within 40% range
  if (ratio <= 1.5 && ratio >= 0.5) return 0.4; // Within 50% range
  return 0.1; // Too far apart
};

// NEW: Bonus points for exceptional matches
export const calculateBonusPoints = (applicant, job) => {
  let bonus = 0;
  
  // Bonus for exact skill matches
  if (applicant.profile?.skills && job.skillsRequired) {
    const exactMatches = applicant.profile.skills.filter(appSkill =>
      job.skillsRequired.some(jobSkill =>
        appSkill.toLowerCase() === jobSkill.toLowerCase()
      )
    ).length;
    
    if (exactMatches > 0) {
      bonus += exactMatches * 2; // 2 points per exact match
    }
  }
  
  // Bonus for relevant certifications
  if (applicant.profile?.certifications?.length > 0) {
    bonus += Math.min(5, applicant.profile.certifications.length);
  }
  
  // Bonus for portfolio/projects
  if (applicant.profile?.projects?.length > 0) {
    bonus += 3;
  }
  
  // Bonus for languages if job requires specific languages
  if (applicant.profile?.languages?.length > 1) {
    bonus += 2;
  }
  
  return Math.min(bonus, 10); // Cap bonus at 10 points
};

// Helper function to explain the score
export const explainScore = (applicant, job, scores) => {
  const explanations = [];
  
  if (scores.skills < 50) {
    explanations.push(`Skills match: ${scores.skills}%. Consider adding: ${job.skillsRequired?.filter(skill => 
      !applicant.profile?.skills?.some(s => skillSimilarity(s, skill) > 0.6)
    ).join(', ')}`);
  }
  
  if (scores.experience < 50) {
    const yearsNeeded = job.experienceLevel === 'senior' ? 5 : job.experienceLevel === 'intermediate' ? 2 : 0;
    explanations.push(`Experience: ${scores.experience}%. This role typically requires ${yearsNeeded} years.`);
  }
  
  return explanations;
};