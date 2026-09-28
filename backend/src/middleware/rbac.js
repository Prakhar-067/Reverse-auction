const { ROLE_PERMISSIONS } = require('../config/roles');
const ApiResponse = require('../utils/ApiResponse');

// Check if user has required role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action.');
    }

    next();
  };
};

// Check if user has specific permission(s)
const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAllPermissions = permissions.every(p => userPermissions.includes(p));

    if (!hasAllPermissions) {
      return ApiResponse.forbidden(res, 'Insufficient permissions.');
    }

    next();
  };
};

// Check if user has any of the specified permissions
const hasAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAny = permissions.some(p => userPermissions.includes(p));

    if (!hasAny) {
      return ApiResponse.forbidden(res, 'Insufficient permissions.');
    }

    next();
  };
};

module.exports = { authorize, hasPermission, hasAnyPermission };
