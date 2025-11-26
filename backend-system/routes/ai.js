import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate qualification score
const calculateQualificationScore = (applicant, job) => {
  let score = 0;
  let maxScore = 100;

  // Skills match (40 points)
  if (applicant.profile?.skills && job.requiredSkills) {
    const applicantSkills = applicant.profile.skills.map(s => s.toLowerCase());
    const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());
    const matchedSkills = applicantSkills.filter(skill => 
      requiredSkills.some(req => req.includes(skill) || skill.includes(req))
    );
    const skillScore = (matchedSkills.length / requiredSkills.length) * 40;
    score += skillScore;
  } else if (job.requiredSkills) {
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

    if (yearsExperience >= minExperience) {
      score += Math.min(35, (yearsExperience / 10) * 35);
    } else {
      score += (yearsExperience / minExperience) * 25;
    }
  } else {
    score += 0;
  }

  // Education (15 points)
  if (applicant.profile?.education) {
    const educationLevel = applicant.profile.education[0]?.level || '';
    const requiredEducation = job.educationLevel || '';

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
      qualificationScore: qualificationScore,
      status: qualificationScore >= 70 ? 'passed' : qualificationScore >= 50 ? 'maybe' : 'failed'
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
    if (!score) {
      score = calculateQualificationScore(application.applicant, application.job);
    }

    res.json({
      message: 'Qualification score retrieved',
      applicationId: application._id,
      candidateName: application.applicantName,
      qualificationScore: score,
      scoreLevel: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low'
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
      qualificationScore: calculateQualificationScore(app.applicant, job),
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
        qualificationScore: app.qualificationScore,
        scoreLevel: app.qualificationScore >= 80 ? 'Excellent' : 
                    app.qualificationScore >= 60 ? 'Good' : 'Fair',
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
      recommendationScore: calculateQualificationScore(applicant, job)
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

export default router;
