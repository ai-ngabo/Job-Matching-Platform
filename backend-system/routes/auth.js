import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTRATION - Enhanced for company business verification
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { 
      email, 
      password, 
      userType, 
      
      // Job seeker fields
      firstName, 
      lastName,
      
      // Company fields - Required
      companyName,
      companyDescription,
      website,
      industry,
      
      // Company contact
      contactPhone,
      contactPersonName,
      contactPersonPosition,
      
      // Company address
      street,
      city,
      district,
      province,
      
      // Business registration
      registrationNumber,
      tinNumber
    } = req.body;

    // Basic validation
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        message: 'Email, password and userType are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Prepare user data based on userType
    const userData = {
      email,
      password,
      userType
    };

    if (userType === 'jobseeker') {
      userData.profile = {
        firstName: firstName || '',
        lastName: lastName || ''
      };
    } else if (userType === 'company') {
      // Enhanced validation for company registration
      if (!companyName) {
        return res.status(400).json({ 
          message: 'Company name is required' 
        });
      }
      if (!contactPersonName) {
        return res.status(400).json({ 
          message: 'Contact person name is required' 
        });
      }
      if (!registrationNumber) {
        return res.status(400).json({ 
          message: 'Business registration number is required' 
        });
      }
      
      userData.company = {
        name: companyName,
        description: companyDescription || '',
        website: website || '',
        industry: industry || '',
        
        // Contact information
        contact: {
          phone: contactPhone || '',
          email: email, // Use registration email as contact email
          personName: contactPersonName,
          personPosition: contactPersonPosition || 'Manager'
        },
        
        // Address
        address: {
          street: street || '',
          city: city || 'Kigali',
          district: district || '',
          province: province || 'Kigali City'
        },
        
        // Business registration (certificate will be uploaded separately)
        businessRegistration: {
          registrationNumber: registrationNumber,
          tinNumber: tinNumber || ''
        }
      };
    }

    const user = new User(userData);
    await user.save();
    
    console.log('User saved successfully:', {
      email: user.email,
      userType: user.userType,
      approvalStatus: user.approvalStatus,
      companyName: user.company?.name
    });

    // Generate token
    const token = generateToken(user._id);

    // Different messages based on user type
    let approvalMessage = '';
    if (user.userType === 'jobseeker') {
      approvalMessage = 'Your job seeker account has been automatically approved!';
    } else {
      approvalMessage = 'Your company account is pending approval. Please upload your business certificate to complete verification.';
    }

    res.status(201).json({
      message: `Registration successful! ${approvalMessage}`,
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus,
        approvedAt: user.approvedAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// Keep the login function the same as before...
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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

    // Check if company is approved
    if (user.userType === 'company' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        message: 'Your company account is pending approval. Please wait for admin approval.',
        approvalStatus: user.approvalStatus,
        needsCertificate: !user.company.businessRegistration.certificate.url
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus,
        approvedAt: user.approvedAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

export default router;