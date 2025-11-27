import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'Token is valid but user not found'
      });
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Add user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      });
    }

    res.status(500).json({
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

export default adminAuth;