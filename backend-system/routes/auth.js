import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

// Ensure bcrypt is available
const bcrypt = bcryptjs;
import User from '../models/User.js';
import {
  sendRegistrationEmail,
  sendAdminRegistrationAlert,
  sendPasswordResetEmail
} from '../utils/emailService.js';

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

    // Allow minimal signup: default to jobseeker when userType not provided
    const resolvedUserType = userType || 'jobseeker';

    console.log('📝 Registration attempt:', { email, userType: resolvedUserType });

    // Basic validation: require email and password only
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create user data (use resolved userType)
    const userData = {
      email,
      password,
      userType: resolvedUserType
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

    const displayName = user.profile?.firstName || user.profile?.lastName || '';
    const savedCompanyName = user.company?.name || '';

    await Promise.all([
      sendRegistrationEmail({
        email: user.email,
        firstName: displayName,
        userType: user.userType,
        companyName: savedCompanyName
      }),
      sendAdminRegistrationAlert({
        email: user.email,
        userType: user.userType,
        companyName: savedCompanyName
      })
    ]);

    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  console.log('🔐 Login attempt received:', {
    email: req.body.email,
    timestamp: new Date().toISOString(),
    hasPassword: !!req.body.password,
    ip: req.ip || req.connection.remoteAddress
  });

  try {
    const { email, password } = req.body;

    console.log('🔍 Looking for user:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', {
      id: user._id,
      userType: user.userType,
      email: user.email
    });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);       
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company
      }
    });

  } catch (error) {
    console.error('❌ Backend login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Avoid email enumeration
      return res.json({
        message: 'If that email exists, reset instructions have been sent.'
      });
    }

    const rawToken = crypto.randomBytes(40).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMinutes = Number(process.env.PASSWORD_TOKEN_EXPIRY_MIN || 30);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    await user.save();

    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail({
      email: user.email,
      firstName: user.profile?.firstName || user.company?.contact?.personName,
      resetUrl,
      expiresInMinutes
    });

    res.json({
      message: 'If that email exists, reset instructions have been sent.'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      message: 'Server error processing password reset',
      error: error.message
    });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in with your new credentials.' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      message: 'Server error while resetting password',
      error: error.message
    });
  }
});

// @route   POST /api/auth/google-login
// @desc    Authenticate user with Google OAuth token
// @access  Public
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Google token is required'
      });
    }

    // Check if Google Client ID is configured
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('❌ GOOGLE_CLIENT_ID environment variable is not set');
      return res.status(500).json({
        message: 'Google authentication is not configured. Please contact support.',
        error: 'GOOGLE_CLIENT_ID missing'
      });
    }

    console.log('🔐 Attempting Google OAuth verification...');
    console.log('📋 Client ID configured:', googleClientId ? 'Yes' : 'No');

    // Initialize Google OAuth client
    const client = new OAuth2Client(googleClientId);
    
    try {
      // Verify the token with Google
      console.log('🔍 Verifying Google token...');
      const ticket = await client.verifyIdToken({
        idToken: token
      });

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';
      const profilePicture = payload.picture;

      console.log('✅ Google OAuth verified for:', email);

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user from Google data
        user = new User({
          email,
          googleId,
          userType: 'jobseeker', // Default to jobseeker, can be updated later
          profile: {
            firstName,
            lastName,
            avatar: profilePicture || null
          },
          // Generate a random password since Google users don't set one
          password: crypto.randomBytes(32).toString('hex')
        });

        await user.save();
        
        console.log('📝 New user created via Google OAuth:', email);
        
        // Send welcome email
        try {
          await sendRegistrationEmail({
            email,
            firstName,
            userType: 'jobseeker',
            companyName: null
          });
        } catch (emailErr) {
          console.warn('⚠️ Could not send welcome email:', emailErr.message);
        }
      }

      // Generate JWT token
      const authToken = generateToken(user._id);

      console.log('✅ Google login successful:', email);

      res.json({
        message: 'Google authentication successful',
        token: authToken,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          company: user.company,
          approvalStatus: user.approvalStatus
        }
      });

    } catch (verifyError) {
      console.error('❌ Google token verification failed:', verifyError.message);
      console.error('❌ Error details:', {
        name: verifyError.name,
        message: verifyError.message,
        code: verifyError.code
      });
      
      // Provide more specific error messages
      let errorMessage = 'Invalid Google token. Please try again.';
      if (verifyError.message.includes('audience')) {
        errorMessage = 'Token audience mismatch. Please check Google Client ID configuration.';
      } else if (verifyError.message.includes('expired')) {
        errorMessage = 'Google token has expired. Please try signing in again.';
      } else if (verifyError.message.includes('signature')) {
        errorMessage = 'Invalid token signature. Please try signing in again.';
      }
      
      return res.status(401).json({
        message: errorMessage,
        error: verifyError.message
      });
    }

  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      message: 'Server error during Google authentication',
      error: error.message
    });
  }
});

// @route   POST /api/auth/google-register
// @desc    Register user with Google OAuth token and userType
// @access  Public
router.post('/google-register', async (req, res) => {
  try {
    const { token, userType = 'jobseeker' } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Google token is required'
      });
    }

    // Validate userType
    if (!['jobseeker', 'company'].includes(userType)) {
      return res.status(400).json({
        message: 'Invalid user type. Must be jobseeker or company'
      });
    }

    // Check if Google Client ID is configured
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('❌ GOOGLE_CLIENT_ID environment variable is not set');
      return res.status(500).json({
        message: 'Google authentication is not configured. Please contact support.',
        error: 'GOOGLE_CLIENT_ID missing'
      });
    }

    console.log('🔐 Attempting Google OAuth registration...', { userType });

    // Initialize Google OAuth client
    const client = new OAuth2Client(googleClientId);

    try {
      // Verify the token with Google
      console.log('🔍 Verifying Google token for registration...');
      const ticket = await client.verifyIdToken({
        idToken: token
      });

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';
      const profilePicture = payload.picture;

      console.log('✅ Google OAuth verified for registration:', email);

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: 'User already exists with this email. Please log in instead.'
        });
      }

      // Create new user from Google data with specified userType
      const userData = {
        email,
        googleId,
        userType: userType,
        // Generate a random password since Google users don't set one
        password: crypto.randomBytes(32).toString('hex')
      };

      // Set up profile or company data based on userType
      if (userType === 'jobseeker') {
        userData.profile = {
          firstName,
          lastName,
          avatar: profilePicture || null
        };
        // Job seekers are auto-approved
        userData.approvalStatus = 'approved';
      } else if (userType === 'company') {
        userData.company = {
          name: `${firstName} ${lastName}`.trim() || 'My Company',
          contact: {
            personName: `${firstName} ${lastName}`.trim(),
            email: email
          }
        };
        // Companies need approval
        userData.approvalStatus = 'pending';
      }

      const user = new User(userData);
      await user.save();

      console.log('📝 New user registered via Google OAuth:', { email, userType });

      // Send welcome email
      try {
        await sendRegistrationEmail({
          email,
          firstName: userType === 'jobseeker' ? firstName : '',
          userType: userType,
          companyName: userType === 'company' ? user.company.name : null
        });

        // Send admin alert for company registrations
        if (userType === 'company') {
          await sendAdminRegistrationAlert({
            email: user.email,
            userType: user.userType,
            companyName: user.company.name
          });
        }
      } catch (emailErr) {
        console.warn('⚠️ Could not send welcome email:', emailErr.message);
      }

      // Generate JWT token
      const authToken = generateToken(user._id);

      console.log('✅ Google registration successful:', { email, userType });

      res.status(201).json({
        message: userType === 'jobseeker' 
          ? 'Job seeker account created successfully with Google!'
          : 'Company account created with Google! Pending approval.',
        token: authToken,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          company: user.company,
          approvalStatus: user.approvalStatus
        }
      });

    } catch (verifyError) {
      console.error('❌ Google token verification failed:', verifyError.message);
      
      let errorMessage = 'Invalid Google token. Please try again.';
      if (verifyError.message.includes('audience')) {
        errorMessage = 'Token audience mismatch. Please check Google Client ID configuration.';
      } else if (verifyError.message.includes('expired')) {
        errorMessage = 'Google token has expired. Please try signing in again.';
      } else if (verifyError.message.includes('signature')) {
        errorMessage = 'Invalid token signature. Please try signing in again.';
      }

      return res.status(401).json({
        message: errorMessage,
        error: verifyError.message
      });
    }

  } catch (error) {
    console.error('❌ Google registration error:', error);
    res.status(500).json({
      message: 'Server error during Google registration',
      error: error.message
    });
  }
});

export default router;