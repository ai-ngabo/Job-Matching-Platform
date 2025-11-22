import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();
    
    if (!token || token === 'null' || token === 'undefined') {
      console.warn('⚠️ No valid authorization token provided');
      return res.status(401).json({ 
        message: 'No token provided, access denied' 
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ 
        message: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure we select approvalStatus as well
    const user = await User.findById(decoded.userId)
      .select('userType email profile company approvalStatus');

    if (!user) {
      return res.status(401).json({ message: 'Token is invalid, user not found' });
    }

    req.user = {
      id: user._id,
      userType: user.userType,
      email: user.email,
      profile: user.profile, 
      company: user.company,
      approvalStatus: user.approvalStatus   
    };

    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', {
      name: error.name,
      message: error.message,
      token: req.header('Authorization')?.substring(0, 20) + '...'
    });
    res.status(401).json({ 
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

export default auth;