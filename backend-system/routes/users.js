import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Server error retrieving profile',
      error: error.message 
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      location, 
      bio, 
      skills,
      // For job seekers
      education,
      experience,
      // For employers
      companyName,
      companyDescription,
      website,
      industry
    } = req.body;

    const updateData = {};
    
    // Update profile fields for job seekers
    if (req.user.userType === 'jobseeker') {
      updateData.profile = {
        firstName: firstName || req.user.profile.firstName,
        lastName: lastName || req.user.profile.lastName,
        phone: phone || req.user.profile.phone,
        location: location || req.user.profile.location,
        bio: bio || req.user.profile.bio,
        skills: skills || req.user.profile.skills,
        education: education || req.user.profile.education,
        experience: experience || req.user.profile.experience
      };
    }
    
    // Update company info for employers
    if (req.user.userType === 'employer') {
      updateData.company = {
        name: companyName || req.user.company.name,
        description: companyDescription || req.user.company.description,
        website: website || req.user.company.website,
        industry: industry || req.user.company.industry
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Server error updating profile',
      error: error.message 
    });
  }
});

// @route   GET /api/users/jobseekers
// @desc    Get all job seekers (for employers)
// @access  Private
router.get('/jobseekers', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ 
        message: 'Only employers can access job seeker profiles' 
      });
    }

    const jobSeekers = await User.find({ userType: 'jobseeker' })
      .select('-password -email')
      .limit(50);

    res.json({
      message: 'Job seekers retrieved successfully',
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

export default router;