import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply auth and adminAuth to all routes
router.use(auth, adminAuth);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobSeekers = await User.countDocuments({ userType: 'jobseeker' });
    const totalCompanies = await User.countDocuments({ userType: 'company' });
    const approvedCompanies = await User.countDocuments({ userType: 'company', approvalStatus: 'approved' });
    const pendingCompanies = await User.countDocuments({ userType: 'company', approvalStatus: 'pending' });
    const rejectedCompanies = await User.countDocuments({ userType: 'company', approvalStatus: 'rejected' });

    res.json({
      message: 'System statistics',
      stats: {
        totalUsers,
        totalJobSeekers,
        totalCompanies,
        approvedCompanies,
        pendingCompanies,
        rejectedCompanies
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving statistics',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/jobseekers
// @desc    Get all job seekers
// @access  Private (Admin only)
router.get('/jobseekers', async (req, res) => {
  try {
    const jobSeekers = await User.find({ userType: 'jobseeker' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      message: 'All job seekers retrieved',
      jobSeekers,
      count: jobSeekers.length
    });
  } catch (error) {
    console.error('Get job seekers error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving job seekers',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private (Admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      message: 'User details retrieved',
      user
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving user details',
      error: error.message 
    });
  }
});


// @route   GET /api/admin/companies/pending
// @desc    Get pending company approvals
// @access  Private (Admin only)
router.get('/companies/pending', async (req, res) => {
  try {
    const pendingCompanies = await User.find({ 
      userType: 'company',
      approvalStatus: 'pending'
    }).select('-password');

    res.json({
      message: 'Pending companies retrieved',
      companies: pendingCompanies,
      count: pendingCompanies.length
    });
  } catch (error) {
    console.error('Get pending companies error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving pending companies',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/companies
// @desc    Get all companies with their approval status
// @access  Private (Admin only)
router.get('/companies', async (req, res) => {
  try {
    const companies = await User.find({ userType: 'company' }).select('-password');

    res.json({
      message: 'All companies retrieved',
      companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving companies',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/companies/:id/approve
// @desc    Approve a company account
// @access  Private (Admin only)
router.put('/companies/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await User.findByIdAndUpdate(
      id,
      { approvalStatus: 'approved' },
      { new: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ 
        message: 'Company not found' 
      });
    }

    console.log(`✅ Company approved: ${company.email}`);

    res.json({
      message: 'Company approved successfully',
      company: {
        _id: company._id,
        email: company.email,
        name: company.company.name,
        approvalStatus: company.approvalStatus
      }
    });
  } catch (error) {
    console.error('Approve company error:', error);
    res.status(500).json({ 
      message: 'Server error approving company',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/companies/:id/reject
// @desc    Reject a company account
// @access  Private (Admin only)
router.put('/companies/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const company = await User.findByIdAndUpdate(
      id,
      { 
        approvalStatus: 'rejected',
        rejectionReason: reason || 'Rejected by admin'
      },
      { new: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ 
        message: 'Company not found' 
      });
    }

    console.log(`❌ Company rejected: ${company.email}`);

    res.json({
      message: 'Company rejected',
      company: {
        _id: company._id,
        email: company.email,
        name: company.company.name,
        approvalStatus: company.approvalStatus
      }
    });
  } catch (error) {
    console.error('Reject company error:', error);
    res.status(500).json({ 
      message: 'Server error rejecting company',
      error: error.message 
    });
  }
});

export default router;
