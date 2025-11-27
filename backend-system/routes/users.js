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
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus,
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
      experienceLevel,
      educationLevel,
      // For employers
      companyName,
      companyDescription,
      website,
      industry,
      companyPhone,
      personName,
      personPosition,
      registrationNumber
    } = req.body;

    const updateData = {};
    
    // Update profile fields for job seekers
    if (req.user.userType === 'jobseeker') {
      updateData['profile.firstName'] = firstName ?? req.user.profile.firstName;
      updateData['profile.lastName'] = lastName ?? req.user.profile.lastName;
      updateData['profile.phone'] = phone ?? req.user.profile.phone;
      updateData['profile.location'] = location ?? req.user.profile.location;
      updateData['profile.bio'] = bio ?? req.user.profile.bio;
      if (skills !== undefined) {
        updateData['profile.skills'] = Array.isArray(skills) ? skills : [skills];
      }
      if (experienceLevel) updateData['profile.experienceLevel'] = experienceLevel;
      if (educationLevel) updateData['profile.educationLevel'] = educationLevel;
    }
    
    // Update company info for companies
    if (req.user.userType === 'company') {
      updateData['company.name'] = companyName ?? req.user.company.name;
      updateData['company.description'] = companyDescription ?? req.user.company.description;
      updateData['company.website'] = website ?? req.user.company.website;
      updateData['company.industry'] = industry ?? req.user.company.industry;
      updateData['company.contact.phone'] = companyPhone ?? req.user.company.contact.phone;
      updateData['company.contact.email'] = req.user.email;
      updateData['company.contact.personName'] = personName ?? req.user.company.contact.personName;
      updateData['company.contact.personPosition'] = personPosition ?? req.user.company.contact.personPosition;
      updateData['company.businessRegistration.registrationNumber'] = registrationNumber ?? req.user.company.businessRegistration.registrationNumber;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus
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
// @desc    Get all job seekers (for companies)
// @access  Private
router.get('/jobseekers', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({ 
        message: 'Only companies can access job seeker profiles' 
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

// @route   PUT /api/users/profile/view
// @desc    Increment profile view count
// @access  Private (Company only)
router.put('/profile/view/:userId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({ message: 'Only companies can view profiles' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile views
    user.profile.views = (user.profile.views || 0) + 1;
    user.profile.lastViewed = new Date();
    
    await user.save();

    res.json({ 
      message: 'Profile view recorded',
      views: user.profile.views 
    });
  } catch (error) {
    console.error('Profile view error:', error);
    res.status(500).json({ 
      message: 'Error recording profile view',
      error: error.message 
    });
  }
});

export default router;