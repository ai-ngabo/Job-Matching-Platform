import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// ==================== STATISTICS ENDPOINTS ====================

// @route   GET /api/admin/stats
// @desc    Get comprehensive admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching comprehensive admin statistics...');

    // Get all statistics in parallel for performance
    const [
      totalUsers,
      totalJobSeekers,
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      rejectedCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      recentUsers,
      recentJobs
    ] = await Promise.all([
      // User counts
      User.countDocuments(),
      User.countDocuments({ userType: 'jobseeker' }),
      User.countDocuments({ userType: 'company' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'approved' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'pending' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'rejected' }),
      
      // Job counts
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      
      // Application count
      Application.countDocuments(),
      
      // Recent activity (last 7 days)
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Job.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const stats = {
      // User Statistics
      totalUsers,
      totalJobSeekers,
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      rejectedCompanies,
      
      // Job Statistics
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      
      // Application Statistics
      totalApplications,
      
      // Platform Growth
      newUsersThisWeek: recentUsers,
      newJobsThisWeek: recentJobs,
      
      // Calculated Metrics
      approvalRate: totalCompanies > 0 ? Math.round((approvedCompanies / totalCompanies) * 100) : 0,
      rejectionRate: totalCompanies > 0 ? Math.round((rejectedCompanies / totalCompanies) * 100) : 0,
      jobFillRate: totalJobs > 0 ? Math.round((activeJobs / totalJobs) * 100) : 0,
      
      // Platform Health
      jobSeekerToCompanyRatio: totalCompanies > 0 ? (totalJobSeekers / totalCompanies).toFixed(1) : 0,
      applicationsPerJob: totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0
    };

    console.log('✅ Admin statistics generated:', stats);

    res.json({
      message: 'Admin statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      message: 'Error fetching admin statistics',
      error: error.message
    });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      userType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (userType) {
      filter.userType = userType;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    // Format user data for frontend
    const formattedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      profile: user.profile || {},
      company: user.company || {},
      approvalStatus: user.approvalStatus || 'approved',
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    }));

    console.log(`✅ Fetched ${formattedUsers.length} users`);

    res.json({
      message: 'Users retrieved successfully',
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private (Admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get additional user data based on type
    let additionalData = {};
    
    if (user.userType === 'jobseeker') {
      const applications = await Application.find({ applicant: user._id })
        .populate('job', 'title companyName')
        .limit(10)
        .lean();
      
      additionalData.applications = applications;
    } else if (user.userType === 'company') {
      const jobs = await Job.find({ company: user._id })
        .limit(10)
        .lean();
      
      const receivedApplications = await Application.countDocuments({ 
        company: user._id 
      });
      
      additionalData.jobs = jobs;
      additionalData.receivedApplications = receivedApplications;
    }

    res.json({
      message: 'User details retrieved successfully',
      user: {
        ...user,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      message: 'Error fetching user details',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's related data based on type
    if (user.userType === 'jobseeker') {
      await Application.deleteMany({ applicant: user._id });
    } else if (user.userType === 'company') {
      // Delete company's jobs and related applications
      const companyJobs = await Job.find({ company: user._id });
      const jobIds = companyJobs.map(job => job._id);
      
      await Application.deleteMany({ job: { $in: jobIds } });
      await Job.deleteMany({ company: user._id });
      await Application.deleteMany({ company: user._id });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    console.log(`✅ User ${user.email} deleted by admin`);

    res.json({
      message: 'User deleted successfully',
      deletedUserId: req.params.id
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// ==================== COMPANY MANAGEMENT ENDPOINTS ====================

// @route   GET /api/admin/companies
// @desc    Get all companies with filtering
// @access  Private (Admin only)
router.get('/companies', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      approvalStatus = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { userType: 'company' };
    
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { 'company.industry': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const companies = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    // Enrich company data with job counts
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const jobCount = await Job.countDocuments({ company: company._id });
        const activeJobCount = await Job.countDocuments({ 
          company: company._id, 
          status: 'active' 
        });
        const applicationCount = await Application.countDocuments({ 
          company: company._id 
        });

        return {
          ...company,
          stats: {
            totalJobs: jobCount,
            activeJobs: activeJobCount,
            totalApplications: applicationCount
          }
        };
      })
    );

    console.log(`✅ Fetched ${companiesWithStats.length} companies`);

    res.json({
      message: 'Companies retrieved successfully',
      companies: companiesWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCompanies: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({
      message: 'Error fetching companies',
      error: error.message
    });
  }
});

// @route   GET /api/admin/companies/pending
// @desc    Get pending companies for approval
// @access  Private (Admin only)
router.get('/companies/pending', async (req, res) => {
  try {
    const pendingCompanies = await User.find({
      userType: 'company',
      approvalStatus: 'pending'
    })
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: 1 })
    .lean();

    console.log(`✅ Found ${pendingCompanies.length} pending companies`);

    res.json({
      message: 'Pending companies retrieved successfully',
      companies: pendingCompanies,
      pendingCount: pendingCompanies.length
    });

  } catch (error) {
    console.error('❌ Get pending companies error:', error);
    res.status(500).json({
      message: 'Error fetching pending companies',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/companies/:id/approve
// @desc    Approve a company
// @access  Private (Admin only)
router.put('/companies/:id/approve', async (req, res) => {
  try {
    const company = await User.findById(req.params.id);

    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        message: 'Company not found'
      });
    }

    if (company.approvalStatus === 'approved') {
      return res.status(400).json({
        message: 'Company is already approved'
      });
    }

    // Update company status
    company.approvalStatus = 'approved';
    company.approvedAt = new Date();
    company.approvedBy = req.user.id;
    
    await company.save();

    console.log(`✅ Company ${company.email} approved by admin`);

    res.json({
      message: 'Company approved successfully',
      company: {
        _id: company._id,
        email: company.email,
        companyName: company.company?.name,
        approvalStatus: company.approvalStatus,
        approvedAt: company.approvedAt
      }
    });

  } catch (error) {
    console.error('❌ Approve company error:', error);
    res.status(500).json({
      message: 'Error approving company',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/companies/:id/reject
// @desc    Reject a company
// @access  Private (Admin only)
router.put('/companies/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const company = await User.findById(req.params.id);

    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        message: 'Company not found'
      });
    }

    if (company.approvalStatus === 'rejected') {
      return res.status(400).json({
        message: 'Company is already rejected'
      });
    }

    // Update company status
    company.approvalStatus = 'rejected';
    company.rejectedAt = new Date();
    company.rejectedBy = req.user.id;
    company.rejectionReason = rejectionReason || 'Not specified';
    
    await company.save();

    console.log(`❌ Company ${company.email} rejected by admin`);

    res.json({
      message: 'Company rejected successfully',
      company: {
        _id: company._id,
        email: company.email,
        companyName: company.company?.name,
        approvalStatus: company.approvalStatus,
        rejectedAt: company.rejectedAt,
        rejectionReason: company.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ Reject company error:', error);
    res.status(500).json({
      message: 'Error rejecting company',
      error: error.message
    });
  }
});

// ==================== JOB MANAGEMENT ENDPOINTS ====================

// @route   GET /api/admin/jobs
// @desc    Get all jobs with filtering
// @access  Private (Admin only)
router.get('/jobs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = '',
      search = '',
      company = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (company) {
      filter.company = company;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(filter)
      .populate('company', 'company.name company.email company.industry')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Job.countDocuments(filter);

    // Enrich job data with application counts
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ 
          job: job._id 
        });

        return {
          ...job,
          applicationCount,
          companyInfo: job.company || {}
        };
      })
    );

    console.log(`✅ Fetched ${jobsWithStats.length} jobs`);

    res.json({
      message: 'Jobs retrieved successfully',
      jobs: jobsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get jobs error:', error);
    res.status(500).json({
      message: 'Error fetching jobs',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/jobs/:id/status
// @desc    Update job status
// @access  Private (Admin only)
router.put('/jobs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: active, paused, or closed'
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    job.status = status;
    job.updatedAt = new Date();
    
    await job.save();

    console.log(`✅ Job ${job.title} status updated to ${status} by admin`);

    res.json({
      message: 'Job status updated successfully',
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        updatedAt: job.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update job status error:', error);
    res.status(500).json({
      message: 'Error updating job status',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/jobs/:id
// @desc    Delete a job
// @access  Private (Admin only)
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Delete related applications
    await Application.deleteMany({ job: job._id });

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    console.log(`✅ Job "${job.title}" deleted by admin`);

    res.json({
      message: 'Job deleted successfully',
      deletedJobId: req.params.id,
      deletedJobTitle: job.title
    });

  } catch (error) {
    console.error('❌ Delete job error:', error);
    res.status(500).json({
      message: 'Error deleting job',
      error: error.message
    });
  }
});

// ==================== APPLICATION MANAGEMENT ENDPOINTS ====================

// @route   GET /api/admin/applications
// @desc    Get all applications with filtering
// @access  Private (Admin only)
router.get('/applications', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = '',
      search = '',
      sortBy = 'appliedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { applicantEmail: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const applications = await Application.find(filter)
      .populate('job', 'title location jobType')
      .populate('applicant', 'profile.firstName profile.lastName profile.skills')
      .populate('company', 'company.name company.industry')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Application.countDocuments(filter);

    console.log(`✅ Fetched ${applications.length} applications`);

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
    console.error('❌ Get applications error:', error);
    res.status(500).json({
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// @route   GET /api/admin/applications/stats
// @desc    Get application statistics
// @access  Private (Admin only)
router.get('/applications/stats', async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    
    const statusCounts = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const applicationsByDate = await Application.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    const stats = {
      totalApplications,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentApplications: applicationsByDate
    };

    res.json({
      message: 'Application statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('❌ Get application stats error:', error);
    res.status(500).json({
      message: 'Error fetching application statistics',
      error: error.message
    });
  }
});

// ==================== PLATFORM ANALYTICS ====================

// @route   GET /api/admin/analytics/overview
// @desc    Get platform overview analytics
// @access  Private (Admin only)
router.get('/analytics/overview', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newCompanies,
      newJobs,
      newApplications,
      activeUsers,
      popularJobs
    ] = await Promise.all([
      // New users in last 30 days
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      
      // New companies in last 30 days
      User.countDocuments({ 
        userType: 'company', 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      
      // New jobs in last 30 days
      Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      
      // New applications in last 30 days
      Application.countDocuments({ appliedAt: { $gte: thirtyDaysAgo } }),
      
      // Active users (logged in last 7 days)
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
      
      // Most popular jobs by application count
      Application.aggregate([
        {
          $group: {
            _id: '$job',
            applicationCount: { $sum: 1 }
          }
        },
        { $sort: { applicationCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    const analytics = {
      growth: {
        newUsers,
        newCompanies,
        newJobs,
        newApplications
      },
      engagement: {
        activeUsers,
        userActivityRate: ((activeUsers / (await User.countDocuments())) * 100).toFixed(1)
      },
      popularJobs
    };

    res.json({
      message: 'Platform analytics retrieved successfully',
      analytics
    });

  } catch (error) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      message: 'Error fetching platform analytics',
      error: error.message
    });
  }
});

export default router;