import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { sendApplicationStatusEmail } from '../utils/emailService.js';

const router = express.Router();

// @route   POST /api/applications/job/:jobId
// @desc    Apply for a job
// @access  Private (Job Seeker only)
router.post('/job/:jobId', auth, async (req, res) => {
  try {
    // Check if user is a job seeker
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can apply for jobs'
      });
    }

    const { coverLetter } = req.body;
    const jobId = req.params.jobId;

    // Find the job
    const job = await Job.findOne({ 
      _id: jobId, 
      status: 'active',
      isVerified: true 
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found or no longer active'
      });
    }

    // Check if application deadline has passed
    if (new Date() > new Date(job.applicationDeadline)) {
      return res.status(400).json({
        message: 'Application deadline has passed'
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this job'
      });
    }

    // Check if job seeker has a CV
    if (!req.user.profile.documents.cv?.url) {
      return res.status(400).json({
        message: 'Please upload your CV before applying for jobs'
      });
    }

    // Create application
    const application = new Application({
      job: jobId,
      jobTitle: job.title,
      company: job.company,  
      companyName: job.companyName,
      applicant: req.user.id,
      applicantName: `${req.user.profile.firstName} ${req.user.profile.lastName}`.trim(),
      applicantEmail: req.user.email,
      coverLetter: coverLetter || '',
      resume: {
        url: req.user.profile.documents.cv.url,
        filename: req.user.profile.documents.cv.filename,
        uploadedAt: req.user.profile.documents.cv.uploadedAt
      }
    });

    await application.save();

    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationCount: 1 }
    });

    res.status(201).json({
      message: 'Application submitted successfully!',
      application: {
        id: application._id,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      message: 'Server error submitting application',
      error: error.message
    });
  }
});

// @route   GET /api/applications/my-applications
// @desc    Get job seeker's applications
// @access  Private (Job Seeker only)
router.get('/my-applications', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can access applications'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter = { applicant: req.user.id };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('job', 'title location jobType category')
      .populate('company', 'company.name company.industry')
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(filter);

    res.json({
      message: 'Applications retrieved successfully',
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      message: 'Server error retrieving applications',
      error: error.message
    });
  }
});

// @route   GET /api/applications/company/received
// @desc    Get applications received by company
// @access  Private (Company only)
router.get('/company/received', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can access received applications'
      });
    }

    const { page = 1, limit = 10, status, jobId } = req.query;

    // Build filter
    const filter = { company: req.user.id };
    if (status) filter.status = status;
    if (jobId) filter.job = jobId;

    const applications = await Application.find(filter)
      .populate('job', 'title location jobType category')
      .populate('applicant', 'profile skills ')
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(filter);

    // Mark as viewed if first time
    if (parseInt(page) === 1 && !jobId) {
      await Application.updateMany(
        { company: req.user.id, viewedByCompany: false },
        { viewedByCompany: true, viewedAt: new Date() }
      );
    }

    res.json({
      message: 'Received applications retrieved successfully',
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get received applications error:', error);
    res.status(500).json({
      message: 'Server error retrieving received applications',
      error: error.message
    });
  }
});
// @route   PUT /api/applications/:id/status
// @desc    Update application status (Company only)
// @access  Private (Company only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can update application status'
      });
    }

    const { status, note, interviewDate, interviewType } = req.body;
    const applicationId = req.params.id;

    const application = await Application.findById(applicationId)
      .populate('job', 'title')
      .populate('company', 'name')
      .populate('applicant', 'email profile');

    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    // Check if company owns this application
    if (application.company._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to update this application'
      });
    }

    const previousStatus = application.status;

    // Update status
    application.status = status;

    // Add to status history with note
    application.statusHistory.push({
      status: status,
      changedAt: new Date(),
      changedBy: 'company',
      note: note || ''
    });

    // Handle interview scheduling
    if (status === 'interview' && interviewDate) {
      application.interview = {
        scheduledAt: new Date(interviewDate),
        interviewType: interviewType || 'video',
        completed: false
      };
    }

    await application.save();

    // Send email notification to applicant
    try {
      const applicantEmail = application.applicant?.email || application.applicantEmail;
      const candidateName = application.applicantName || `${application.applicant?.profile?.firstName} ${application.applicant?.profile?.lastName}`;
      const companyName = application.company?.name || 'Our Company';
      const jobTitle = application.jobTitle || application.job?.title || 'Position';

      if (applicantEmail) {
        await sendApplicationStatusEmail({
          email: applicantEmail,
          candidateName: candidateName.trim(),
          companyName: companyName,
          jobTitle: jobTitle,
          newStatus: status,
          note: note || ''
        });
        console.log(`📧 Application status email sent to ${applicantEmail}`);
      }
    } catch (emailError) {
      console.error('Error sending status email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Application status updated successfully',
      application: {
        id: application._id,
        status: application.status,
        applicantName: application.applicantName,
        jobTitle: application.job.title,
        statusHistory: application.statusHistory
      }
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      message: 'Server error updating application status',
      error: error.message
    });
  }
});

// @route   GET /api/applications/stats
// @desc    Get application statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.userType === 'jobseeker') {
      // Job seeker stats
      const totalApplications = await Application.countDocuments({
        applicant: req.user.id   
      });

      const statusCounts = await Application.aggregate([
        { $match: { applicant: req.user.id } },   
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      stats = {
        totalApplications,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };

    } else if (req.user.userType === 'company') {
      // Company stats
      const totalApplications = await Application.countDocuments({
        company: req.user.id
      });

      const statusCounts = await Application.aggregate([
        { $match: { company: req.user.id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const unviewedCount = await Application.countDocuments({
        company: req.user.id,
        viewedByCompany: false
      });

      stats = {
        totalApplications,
        unviewedApplications: unviewedCount,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    }

    res.json({
      message: 'Application statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      message: 'Server error retrieving application statistics',
      error: error.message
    });
  }
});

export default router;