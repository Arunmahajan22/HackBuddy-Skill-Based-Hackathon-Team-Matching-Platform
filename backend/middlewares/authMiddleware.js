const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware:
 * Inspects both secure HTTP-only cookies and standard Authorization: Bearer <token> headers.
 * Protects against token tampering, expiry, and non-existent users.
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first (highest security against XSS)
    if (req.cookies && req.cookies.hackbuddy_token) {
      token = req.cookies.hackbuddy_token;
    }

    // 2. Fall back to Authorization Bearer header (for mobile / API clients)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required to access this resource.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select('-password').lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'TOKEN_INVALID',
      });
    }
    return next(error);
  }
};

module.exports = { protect };
