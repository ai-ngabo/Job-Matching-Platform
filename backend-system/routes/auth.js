import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { 
    expiresIn: '30d' 
  });
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      userType,
      firstName,
      lastName,
      bio,
      location,
      phone,
      skills,
      experienceLevel,
      educationLevel,
      companyName,
      companyDescription,
      companyWebsite,
      companyIndustry,
      companyContactPhone,
      companyContactEmail
    } = req.body;
    
    console.log('📝 Registration attempt:', { email, userType });
    
    // Basic validation
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        message: 'Email, password and userType are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create user data
    const userData = {
      email,
      password,
      userType
    };

    if (userType === 'jobseeker') {
      const parsedSkills = Array.isArray(skills)
        ? skills
        : typeof skills === 'string' && skills.length > 0
        ? skills.split(',').map((skill) => skill.trim()).filter(Boolean)
        : [];

      userData.profile = {
        firstName: firstName || '',
        lastName: lastName || '',
        bio: bio || '',
        location: location || '',
        phone: phone || '',
        skills: parsedSkills,
        experienceLevel: experienceLevel || 'entry',
        educationLevel: educationLevel || 'high-school'
      };
    } else if (userType === 'company') {
      userData.company = {
        name: companyName || '',
        description: companyDescription || '',
        website: companyWebsite || '',
        industry: companyIndustry || '',
        contact: {
          phone: companyContactPhone || '',
          email: companyContactEmail || ''
        }
      };
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: user.userType === 'jobseeker' 
        ? 'Job seeker account created successfully!' 
        : 'Company account created! Pending approval.',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check approval for companies
    if (user.userType === 'company' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        message: 'Company account not yet approved',
        approvalStatus: user.approvalStatus
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        userType: user.userType,
        email: user.email,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus
      }
    });


  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

export default router;