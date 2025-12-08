import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { calculateQualificationScore, calculateSkillsMatch, calculateExperienceMatch, calculateEducationMatch } from '../utils/aiUtils.js';

const router = express.Router();


// @route   POST /api/ai/screen-cv
// @desc    Screen CV against job requirements
// @access  Private (Company only)
router.post('/screen-cv', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can screen CVs'
      });
    }

    const { applicationId, jobId } = req.body;

    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('applicant', 'profile email');

    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    if (application.company.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to screen this application'
      });
    }

    const applicant = application.applicant;
    const job = application.job;

  // Calculate qualification score
  const qualificationScore = calculateQualificationScore(applicant, job);

    // Store the screening result
    application.aiScreening = {
      screenedAt: new Date(),
      qualificationScore: Math.round(qualificationScore),
      status: Math.round(qualificationScore) >= 70 ? 'passed' : Math.round(qualificationScore) >= 50 ? 'maybe' : 'failed'
    };

    await application.save();

    // Prepare screening report
    const screeningReport = {
      applicationId: application._id,
      candidateName: application.applicantName,
      candidateEmail: application.applicantEmail,
      jobTitle: application.jobTitle,
      qualificationScore: qualificationScore,
      screeningStatus: application.aiScreening.status,
      analysis: {
        skills: {
          found: applicant.profile?.skills || [],
          required: job.requiredSkills || [],
          matchPercentage: applicant.profile?.skills 
            ? Math.round((applicant.profile.skills.filter(s => 
                job.requiredSkills?.some(req => req.toLowerCase().includes(s.toLowerCase()))
              ).length / (job.requiredSkills?.length || 1)) * 100)
            : 0
        },
        experience: {
          totalYears: applicant.profile?.experience?.length > 0
            ? applicant.profile.experience.reduce((total, exp) => {
                const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
                const startYear = new Date(exp.startDate).getFullYear();
                return total + (endYear - startYear);
              }, 0)
            : 0,
          required: job.experienceLevel || 'Not specified'
        },
        education: {
          highest: applicant.profile?.education?.[0]?.level || 'Not specified',
          required: job.educationLevel || 'Not specified'
        },
        cvUploaded: !!applicant.profile?.documents?.cv?.url,
        recommendation: qualificationScore >= 70 
          ? 'Highly recommended for interview' 
          : qualificationScore >= 50 
          ? 'Consider for further review' 
          : 'Not recommended at this time'
      }
    };

    res.json({
      message: 'CV screening completed',
      screening: screeningReport
    });

  } catch (error) {
    console.error('CV screening error:', error);
    res.status(500).json({
      message: 'Error screening CV',
      error: error.message
    });
  }
});

// @route   GET /api/ai/qualification-score/:applicationId
// @desc    Get qualification score for an application
// @access  Private (Company only)
router.get('/qualification-score/:applicationId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can view qualification scores'
      });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job')
      .populate('applicant', 'profile email');

    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    if (application.company.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this application'
      });
    }

    // Calculate score if not already done
    let score = application.aiScreening?.qualificationScore;
    if (!score && score !== 0) {
      score = Math.round(calculateQualificationScore(application.applicant, application.job));
    }

    res.json({
      message: 'Qualification score retrieved',
      applicationId: application._id,
      candidateName: application.applicantName,
      qualificationScore: Math.round(score),
      scoreLevel: Math.round(score) >= 80 ? 'Excellent' : Math.round(score) >= 60 ? 'Good' : Math.round(score) >= 40 ? 'Fair' : 'Low'
    });

  } catch (error) {
    console.error('Get qualification score error:', error);
    res.status(500).json({
      message: 'Error retrieving qualification score',
      error: error.message
    });
  }
});

// @route   GET /api/ai/shortlist/:jobId
// @desc    Get top shortlisted candidates for a job
// @access  Private (Company only)
router.get('/shortlist/:jobId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can view shortlisted candidates'
      });
    }

    const { limit = 5 } = req.query;
    const jobId = req.params.jobId;

    // Get job and verify company owns it
    const job = await Job.findById(jobId);
    if (!job || job.company.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this job'
      });
    }

    // Get all applications for this job
    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'profile email');

    // Calculate scores for all applications
    const scoredApplications = applications.map(app => ({
      ...app.toObject(),
      qualificationScore: Math.round(calculateQualificationScore(app.applicant, job)),
      isShortlisted: app.isShortlisted || false
    }));

    // Sort by score descending
    const topCandidates = scoredApplications
      .sort((a, b) => b.qualificationScore - a.qualificationScore)
      .slice(0, parseInt(limit));

    res.json({
      message: 'Top candidates retrieved',
      jobId: jobId,
      jobTitle: job.title,
      totalApplications: applications.length,
      topCandidates: topCandidates.map(app => ({
        id: app._id,
        candidateName: app.applicantName,
        candidateEmail: app.applicantEmail,
        qualificationScore: Math.round(app.qualificationScore),
        scoreLevel: Math.round(app.qualificationScore) >= 80 ? 'Excellent' : 
                    Math.round(app.qualificationScore) >= 60 ? 'Good' : 'Fair',
        status: app.status,
        isShortlisted: app.isShortlisted,
        appliedAt: app.appliedAt
      }))
    });

  } catch (error) {
    console.error('Get shortlist error:', error);
    res.status(500).json({
      message: 'Error retrieving shortlisted candidates',
      error: error.message
    });
  }
});

// @route   PUT /api/ai/shortlist/:applicationId
// @desc    Toggle shortlist status for an application
// @access  Private (Company only)
router.put('/shortlist/:applicationId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can shortlist candidates'
      });
    }

    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    if (application.company.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to update this application'
      });
    }

    // Toggle shortlist
    application.isShortlisted = !application.isShortlisted;

    if (application.isShortlisted) {
      application.statusHistory.push({
        status: 'shortlisted',
        changedAt: new Date(),
        changedBy: 'company',
        note: 'Shortlisted via AI screening'
      });
    }

    await application.save();

    res.json({
      message: application.isShortlisted ? 'Candidate shortlisted' : 'Candidate removed from shortlist',
      applicationId: application._id,
      isShortlisted: application.isShortlisted
    });

  } catch (error) {
    console.error('Shortlist error:', error);
    res.status(500).json({
      message: 'Error updating shortlist',
      error: error.message
    });
  }
});

// @route   GET /api/ai/recommendations/:applicationId
// @desc    Get job recommendations for a candidate
// @access  Private (Job Seeker only)
router.get('/recommendations/:applicationId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can view recommendations'
      });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    const applicant = await User.findById(req.user.id);

    // Find recommended jobs based on skills and experience
    const recommendedJobs = await Job.find({
      status: 'active',
      isVerified: true,
      _id: { $nin: await Application.distinct('job', { applicant: req.user.id }) }
    }).limit(10);

    const scoredJobs = recommendedJobs.map(job => ({
      ...job.toObject(),
      recommendationScore: Math.round(calculateQualificationScore(applicant, job))
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 5);

    res.json({
      message: 'Job recommendations retrieved',
      recommendations: scoredJobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.companyName,
        location: job.location,
        recommendationScore: job.recommendationScore,
        matchLevel: job.recommendationScore >= 80 ? 'Perfect Match' : 
                    job.recommendationScore >= 60 ? 'Good Match' : 'Moderate Match'
      }))
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      message: 'Error retrieving recommendations',
      error: error.message
    });
  }
});

// @route   GET /api/ai/match-score/:jobId
// @desc    Get match score for current job seeker against a specific job
// @access  Private (Job Seeker only)
router.get('/match-score/:jobId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can view match scores'
      });
    }

    const jobId = req.params.jobId;
    const jobSeekerId = req.user.id;

    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Get the job seeker
    const jobSeeker = await User.findById(jobSeekerId);
    if (!jobSeeker) {
      return res.status(404).json({
        message: 'Job seeker profile not found'
      });
    }

    // Calculate match score
    const matchScore = calculateQualificationScore(jobSeeker, job);

    res.json({
      message: 'Match score calculated successfully',
      jobId: jobId,
      jobTitle: job.title,
      matchScore: Math.round(matchScore),
      matchLevel: matchScore >= 80 ? 'Excellent' : 
                  matchScore >= 60 ? 'Good' : 
                  matchScore >= 40 ? 'Fair' : 'Low',
      matchBreakdown: {
        skillsMatch: calculateSkillsMatch(jobSeeker, job),
        experienceMatch: calculateExperienceMatch(jobSeeker, job),
        educationMatch: calculateEducationMatch(jobSeeker, job),
        documentReady: !!jobSeeker.profile?.documents?.cv?.url
      }
    });

  } catch (error) {
    console.error('Get match score error:', error);
    res.status(500).json({
      message: 'Error calculating match score',
      error: error.message
    });
  }
});

// @route   GET /api/ai/jobseeker-report
// @desc    Get comprehensive AI report for job seeker
// @access  Private (Job Seeker only)
router.get('/jobseeker-report', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can view AI reports'
      });
    }

    const jobSeeker = await User.findById(req.user.id)
      .select('profile email savedJobs')
      .populate('profile.skills profile.experience profile.education profile.documents');

    // Get recent jobs to analyze against
    const recentJobs = await Job.find({ status: 'active' })
      .limit(10)
      .sort({ createdAt: -1 });

    // Calculate scores for recent jobs
    const jobScores = recentJobs.map(job => ({
      jobId: job._id,
      jobTitle: job.title,
      company: job.companyName,
      matchScore: Math.round(calculateQualificationScore(jobSeeker, job)),
      skillsScore: calculateSkillsMatch(jobSeeker, job),
      experienceScore: calculateExperienceMatch(jobSeeker, job),
      educationScore: calculateEducationMatch(jobSeeker, job)
    }));

    // Calculate average scores
    const avgMatchScore = jobScores.length > 0 
      ? Math.round(jobScores.reduce((sum, js) => sum + js.matchScore, 0) / jobScores.length)
      : 0;

    // Generate improvement suggestions
    const suggestions = generateImprovementSuggestions(jobSeeker, jobScores);

    // Prepare report
    const report = {
      profileCompleteness: calculateProfileCompleteness(jobSeeker),
      overallMatchPotential: avgMatchScore,
      areaBreakdown: {
        skills: {
          score: jobScores.length > 0 
            ? Math.round(jobScores.reduce((sum, js) => sum + js.skillsScore, 0) / jobScores.length)
            : 0,
          strength: jobSeeker.profile?.skills?.length > 5 ? 'Strong' : 'Needs Improvement',
          suggestions: suggestions.skills
        },
        experience: {
          score: jobScores.length > 0 
            ? Math.round(jobScores.reduce((sum, js) => sum + js.experienceScore, 0) / jobScores.length)
            : 0,
          strength: jobSeeker.profile?.experience?.length > 0 ? 'Good' : 'Needs Experience',
          suggestions: suggestions.experience
        },
        education: {
          score: jobScores.length > 0 
            ? Math.round(jobScores.reduce((sum, js) => sum + js.educationScore, 0) / jobScores.length)
            : 0,
          strength: jobSeeker.profile?.education?.length > 0 ? 'Good' : 'Needs Education Info',
          suggestions: suggestions.education
        }
      },
      topRecommendations: [
        'Complete your profile with detailed skills and experience',
        'Upload your CV/resume to increase match scores',
        'Add at least 5 relevant skills to your profile',
        'Include specific achievements in your experience section'
      ],
      recentJobMatches: jobScores.slice(0, 5)
    };

    res.json({
      message: 'AI report generated successfully',
      report: report,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Generate AI report error:', error);
    res.status(500).json({
      message: 'Error generating AI report',
      error: error.message
    });
  }
});

router.get('/jobseeker-analysis', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can view AI analysis'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's applications for stats
    const applications = await Application.find({ applicant: req.user.id });
    
    // Get recent jobs to calculate match scores
    const recentJobs = await Job.find({ status: 'active' }).limit(10);
    
    // Calculate average match score
    let totalScore = 0;
    let scoresCount = 0;
    
    for (const job of recentJobs) {
      const score = calculateQualificationScore(user, job);
      if (score > 0) {
        totalScore += score;
        scoresCount++;
      }
    }
    
    const avgScore = scoresCount > 0 ? Math.round(totalScore / scoresCount) : 50;
    
    // Generate analysis
    const analysis = {
      overallScore: avgScore,
      breakdown: {
        skills: Math.round(calculateSkillsMatch(user, { skillsRequired: [] })),
        experience: Math.round(calculateExperienceMatch(user, { experienceLevel: 'entry' })),
        education: Math.round(calculateEducationMatch(user, {})),
        profileCompleteness: calculateProfileCompleteness(user)
      },
      strengths: generateStrengths(user),
      improvementAreas: generateImprovementAreas(user),
      proficiencyLevel: getProficiencyLevel(avgScore)
    };

    res.json({
      message: 'AI analysis generated successfully',
      analysis: analysis
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      message: 'Error generating AI analysis',
      error: error.message
    });
  }
});

// Helper functions
const calculateProfileCompleteness = (user) => {
  const profile = user.profile || {};
  let score = 0;
  
  if (profile.firstName && profile.lastName) score += 30;
  if (profile.email) score += 20;
  if (profile.phone) score += 10;
  if (profile.location) score += 10;
  if (profile.skills && profile.skills.length >= 3) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 10;
  if (profile.education && profile.education.length > 0) score += 5;
  
  return Math.min(100, score);
};

const generateStrengths = (user) => {
  const profile = user.profile || {};
  const strengths = [];
  
  if (profile.skills && profile.skills.length >= 5) {
    strengths.push('Strong technical skill set');
  } else if (profile.skills && profile.skills.length > 0) {
    strengths.push('Good foundational skills');
  }
  
  if (profile.experience && profile.experience.length > 0) {
    strengths.push('Relevant work experience');
  }
  
  if (profile.education && profile.education.length > 0) {
    strengths.push('Good educational background');
  }
  
  if (profile.documents?.cv?.url) {
    strengths.push('Professional CV available');
  }
  
  if (strengths.length === 0) {
    strengths.push('Great potential', 'Willingness to learn');
  }
  
  return strengths.slice(0, 3);
};

const generateImprovementAreas = (user) => {
  const profile = user.profile || {};
  const areas = [];
  
  if (!profile.skills || profile.skills.length < 3) {
    areas.push('Add more skills to your profile');
  }
  
  if (!profile.experience || profile.experience.length === 0) {
    areas.push('Add work experience or projects');
  }
  
  if (!profile.documents?.cv?.url) {
    areas.push('Upload your CV/resume');
  }
  
  if (!profile.summary || profile.summary.length < 50) {
    areas.push('Write a professional summary');
  }
  
  if (areas.length === 0) {
    areas.push('Keep your profile updated', 'Network with professionals');
  }
  
  return areas.slice(0, 3);
};

const getProficiencyLevel = (score) => {
  if (score >= 80) return 'Expert';
  if (score >= 65) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
};

export default router;
