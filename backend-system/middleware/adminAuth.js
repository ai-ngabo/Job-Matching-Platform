const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authenticated' 
      });
    }

    if (req.user.userType !== 'admin') {
      console.warn(`⚠️ Non-admin user attempted to access admin endpoint: ${req.user.email}`);
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    res.status(403).json({ 
      message: 'Authorization failed',
      error: error.message
    });
  }
};

export default adminAuth;
