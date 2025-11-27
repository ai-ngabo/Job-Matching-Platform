// routes/admin.js - Complete version
import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Simple admin check middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Apply auth and admin check to all routes
router.use(auth);
router.use(requireAdmin);

// ==================== BASIC ADMIN ROUTES ====================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching admin statistics...');

    const [
      totalUsers,
      totalJobSeekers,
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      rejectedCompanies,
      totalJobs,
      activeJobs,
      totalApplications
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'jobseeker' }),
      User.countDocuments({ userType: 'company' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'approved' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'pending' }),
      User.countDocuments({ userType: 'company', approvalStatus: 'rejected' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments()
    ]);

    const stats = {
      totalUsers,
      totalJobSeekers,
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      rejectedCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      approvalRate: totalCompanies > 0 ? Math.round((approvedCompanies / totalCompanies) * 100) : 0,
      rejectionRate: totalCompanies > 0 ? Math.round((rejectedCompanies / totalCompanies) * 100) : 0
    };

    console.log('✅ Admin stats:', stats);

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

// @route   GET /api/admin/users
// @desc    Get all users (THIS IS MISSING)
router.get('/users', async (req, res) => {
  try {
    const { limit = 100, search = '' } = req.query;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      profile: user.profile || {},
      company: user.company || {},
      approvalStatus: user.approvalStatus || 'approved',
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      message: 'Users retrieved successfully',
      users: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   GET /api/admin/companies
// @desc    Get all companies
router.get('/companies', async (req, res) => {
  try {
    const { limit = 100, status = '' } = req.query;

    let filter = { userType: 'company' };
    if (status) {
      filter.approvalStatus = status;
    }

    const companies = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Add job counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const jobCount = await Job.countDocuments({ company: company._id });
        return {
          ...company,
          stats: { totalJobs: jobCount }
        };
      })
    );

    res.json({
      message: 'Companies retrieved successfully',
      companies: companiesWithStats,
      total: companiesWithStats.length
    });

  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({
      message: 'Error fetching companies',
      error: error.message
    });
  }
});

// @route   GET /api/admin/jobs
// @desc    Get all jobs (THIS IS MISSING)
router.get('/jobs', async (req, res) => {
  try {
    const { limit = 50, status = '' } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const jobs = await Job.find(filter)
      .populate('company', 'company.name company.email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Add application counts
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job: job._id });
        return {
          ...job,
          applicationCount
        };
      })
    );

    res.json({
      message: 'Jobs retrieved successfully',
      jobs: jobsWithStats,
      total: jobsWithStats.length
    });

  } catch (error) {
    console.error('❌ Get jobs error:', error);
    res.status(500).json({
      message: 'Error fetching jobs',
      error: error.message
    });
  }
});

// @route   GET /api/admin/applications
// @desc    Get all applications (THIS IS MISSING)
router.get('/applications', async (req, res) => {
  try {
    const { limit = 100, status = '' } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('applicant', 'profile.firstName profile.lastName email')
      .populate('job', 'title company')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: 'Applications retrieved successfully',
      applications,
      total: applications.length
    });

  } catch (error) {
    console.error('❌ Get applications error:', error);
    res.status(500).json({
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/companies/:id/approve
// @desc    Approve a company
router.put('/companies/:id/approve', async (req, res) => {
  try {
    const company = await User.findById(req.params.id);

    if (!company || company.userType !== 'company') {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.approvalStatus = 'approved';
    company.approvedAt = new Date();
    await company.save();

    console.log(`✅ Company approved: ${company.email}`);

    res.json({
      message: 'Company approved successfully',
      company: {
        _id: company._id,
        email: company.email,
        companyName: company.company?.name,
        approvalStatus: company.approvalStatus
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
router.put('/companies/:id/reject', async (req, res) => {
  try {
    const company = await User.findById(req.params.id);

    if (!company || company.userType !== 'company') {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.approvalStatus = 'rejected';
    company.rejectedAt = new Date();
    company.rejectionReason = req.body.rejectionReason || 'Not specified';
    await company.save();

    console.log(`❌ Company rejected: ${company.email}`);

    res.json({
      message: 'Company rejected successfully',
      company: {
        _id: company._id,
        email: company.email,
        companyName: company.company?.name,
        approvalStatus: company.approvalStatus
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

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (THIS IS MISSING)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete user's data based on type
    if (user.userType === 'jobseeker') {
      await Application.deleteMany({ applicant: user._id });
    } else if (user.userType === 'company') {
      const jobs = await Job.find({ company: user._id });
      const jobIds = jobs.map(job => job._id);
      await Application.deleteMany({ job: { $in: jobIds } });
      await Job.deleteMany({ company: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

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

export default router;