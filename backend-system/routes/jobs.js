import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Company only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is a company and approved
    if (req.user.userType !== 'company' || req.user.approvalStatus !== 'approved') {
      return res.status(403).json({
        message: 'Only approved companies can post jobs'
      });
    }

    const {
      title,
      description,
      requirements,
      skillsRequired,
      location,
      jobType,
      category,
      salaryRange,
      applicationDeadline,
      applicationProcess,
      externalLink,
      applicationEmail
    } = req.body;

    // Basic validation
    if (!title || !description || !requirements || !applicationDeadline) {
      return res.status(400).json({
        message: 'Title, description, requirements, and deadline are required'
      });
    }

    // Create new job
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
      companyName: req.user.company.name
    });

    await job.save();

    res.status(201).json({
      message: 'Job posted successfully! It will be visible after verification.',
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
    res.status(500).json({
      message: 'Server error creating job',
      error: error.message
    });
  }
});

// @route   GET /api/jobs
// @desc    Get all active jobs with filtering and pagination
// @access  Public (for now, will add auth later)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      jobType,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active', isVerified: true };
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Job type filter
    if (jobType) {
      filter.jobType = jobType;
    }
    
    // Location filter
    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const jobs = await Job.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-requirements -description') // Lightweight for listing
      .populate('company', 'company.name company.industry');

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    res.json({
      message: 'Jobs retrieved successfully',
      jobs,
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
    res.status(500).json({
      message: 'Server error retrieving jobs',
      error: error.message
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'company.name company.description company.website company.industry company.address');

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json({
      message: 'Job details retrieved successfully',
      job
    });

  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({
      message: 'Server error retrieving job details',
      error: error.message
    });
  }
});

// @route   GET /api/jobs/company/my-jobs
// @desc    Get jobs posted by current company
// @access  Private (Company only)
router.get('/company/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({
        message: 'Only companies can access this endpoint'
      });
    }

    const jobs = await Job.find({ company: req.user.id })
      .sort({ createdAt: -1 })
      .select('-requirements -description'); // Lightweight for dashboard

    res.json({
      message: 'Company jobs retrieved successfully',
      jobs,
      count: jobs.length
    });

  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      message: 'Server error retrieving company jobs',
      error: error.message
    });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job posting
// @access  Private (Company owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Check if user owns this job
    if (job.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this job'
      });
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

    // Reset verification if important fields change
    if (updates.title || updates.description || updates.requirements) {
      updates.isVerified = false;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      message: 'Server error updating job',
      error: error.message
    });
  }
});

export default router;