import express from 'express';
import Job from '../models/Job.js';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import { calculateQualificationScore } from '../utils/aiUtils.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Company only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company' || req.user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Only approved companies can post jobs' });
    }

    const {
      title, description, requirements, skillsRequired,
      location, jobType, category, salaryRange,
      applicationDeadline, applicationProcess, externalLink, applicationEmail
    } = req.body;

    if (!title || !description || !requirements || !applicationDeadline) {
      return res.status(400).json({ message: 'Title, description, requirements, and deadline are required' });
    }

    const job = new Job({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      skillsRequired: skillsRequired || [],
      location: location || 'Kigali, Rwanda',
      jobType: jobType || 'full-time',
      category: category || 'other',
      salaryRange: salaryRange || {},
      applicationDeadline: new Date(applicationDeadline),
      applicationProcess: applicationProcess || 'quick-apply',
      externalLink: externalLink || '',
      applicationEmail: applicationEmail || '',
      company: req.user.id,      
      companyName: req.user.company?.name || ''   
    });

    await job.save();

    res.status(201).json({
      message: 'Job posted successfully!',
      job: {
        id: job._id,
        title: job.title,
        company: job.companyName,
        location: job.location,
        jobType: job.jobType,
        category: job.category,
        status: job.status,
        createdAt: job.createdAt
      }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error creating job', error: error.message });
  }
});

// @route   GET /api/jobs
// @desc    Get all active jobs with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search, category, jobType, location,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };   

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (location) filter.location = new RegExp(location, 'i');

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-requirements')
      .populate('company', 'company.name company.industry company.logo');

    // If the request contains a valid JWT for a jobseeker, compute per-job match scores
    let requestingUser = null;
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '')?.trim();
      if (token && token !== 'null' && token !== 'undefined' && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Load minimal user info for scoring
        requestingUser = await User.findById(decoded.userId).select('userType profile');
      }
    } catch (err) {
      // If token invalid, ignore scoring and continue as public
      console.warn('Optional auth token invalid or missing for /api/jobs; returning public listing');
      requestingUser = null;
    }

    const total = await Job.countDocuments(filter);

    // If we have a requesting jobseeker, compute matchScore per job
    let jobsToReturn = jobs;
    if (requestingUser && requestingUser.userType === 'jobseeker') {
      jobsToReturn = jobs.map(job => {
        try {
          const score = Math.round(calculateQualificationScore(requestingUser, job));
          return { ...job.toObject(), matchScore: score };
        } catch (err) {
          console.error('Error calculating match score for job', job._id, err.message);
          return { ...job.toObject(), matchScore: null };
        }
      });
    } else {
      jobsToReturn = jobs.map(j => j.toObject());
    }

    res.json({
      message: 'Jobs retrieved successfully',
      jobs: jobsToReturn,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error retrieving jobs', error: error.message });
  }
});

// @route   GET /api/jobs/company/my-jobs
// @desc    Get jobs posted by current company
// @access  Private (Company only)
router.get('/company/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({ message: 'Only companies can access this endpoint' });
    }

    const jobs = await Job.find({ company: req.user.id })
      .sort({ createdAt: -1 })
      .select('-requirements -description');

    res.json({ message: 'Company jobs retrieved successfully', jobs, count: jobs.length });
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({ message: 'Server error retrieving company jobs', error: error.message });
  }
});

// @route   GET /api/jobs/saved
// @desc    Get saved jobs for job seeker
// @access  Private (Job Seeker only)
router.get('/saved', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ message: 'Only job seekers can access saved jobs' });
    }

    const user = await User.findById(req.user.id).populate({
      path: 'savedJobs',
      match: { status: 'active' },
      select: 'title companyName location jobType category createdAt'
    });
    
    res.json({
      message: 'Saved jobs retrieved successfully',
      savedJobs: (user.savedJobs || []).map(job => {
        try {
          const score = Math.round(calculateQualificationScore(req.user, job));
          return { ...job.toObject(), matchScore: score };
        } catch (err) {
          console.error('Error calculating match score for saved job', job._id, err.message);
          return { ...job.toObject(), matchScore: null };
        }
      })
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      message: 'Server error retrieving saved jobs',
      error: error.message
    });
  }
});


// @route   GET /api/jobs/recommended
// @desc    Get recommended jobs for job seeker
// @access  Private (Job Seeker only)
router.get('/recommended', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access recommended jobs'
      });
    }

    const user = await User.findById(req.user.id);
    const userProfile = user.profile || {};
    const userSkills = userProfile.skills || [];
    
    // Get active jobs - simplified query
    const jobs = await Job.find({
      status: 'active',
      applicationDeadline: { $gte: new Date() }
    })
      .populate('company', 'name description industry logo')
      .limit(parseInt(req.query.limit) || 6)
      .sort({ createdAt: -1 });

    // Calculate match score using the centralized qualification score logic
    const jobsWithScore = jobs.map(job => ({
      ...job.toObject(),
      matchScore: Math.round(calculateQualificationScore(user, job))
    }));

    // Sort by match score (highest first)
    jobsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: jobsWithScore,
      count: jobsWithScore.length
    });

  } catch (error) {
    console.error('❌ Get recommended jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting recommended jobs',
      error: error.message,
      stack: error.stack // Add stack trace for debugging
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'company.name company.description company.website company.industry company.logo');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.views += 1;
    await job.save();

    res.json({ message: 'Job details retrieved successfully', job });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({ message: 'Server error retrieving job details', error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job posting
// @access  Private (Company owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.company.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const allowedUpdates = [
      'title', 'description', 'requirements', 'skillsRequired', 'location',
      'jobType', 'category', 'salaryRange', 'applicationDeadline',
      'applicationProcess', 'externalLink', 'applicationEmail', 'status'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.title || updates.description || updates.requirements) {
      updates.isVerified = false;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error updating job', error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job posting
// @access  Private (Company owner or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.company.toString() !== req.user.id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully', deletedJobId: req.params.id });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error deleting job', error: error.message });
  }
});

export default router;