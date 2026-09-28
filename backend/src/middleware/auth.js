const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const ApiResponse = require('../utils/ApiResponse');

// Authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-passwordHash -otpCode -otpExpiry -mfaSecret');

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found. Token invalid.');
    }

    if (user.status !== 'ACTIVE') {
      return ApiResponse.forbidden(res, 'Account is not active.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired.');
    }
    return ApiResponse.error(res, 'Authentication error.');
  }
};

// Optional authentication (for public routes that may show extra data to authenticated users)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id).select('-passwordHash -otpCode -otpExpiry -mfaSecret');
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
