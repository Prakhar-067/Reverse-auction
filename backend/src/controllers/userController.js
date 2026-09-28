const User = require('../models/User');
const { AUTH_METHODS, ROLES } = require('../config/roles');
const AuditService = require('../services/auditService');
const ApiResponse = require('../utils/ApiResponse');

// Get all users (admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -otpCode -otpExpiry -mfaSecret')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -otpCode -otpExpiry -mfaSecret');
    if (!user) return ApiResponse.notFound(res, 'User not found.');
    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

// Create user (admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, username, password, role, phone, company, status } = req.body;

    if (!name || !email || !password || !role) {
      return ApiResponse.badRequest(res, 'Name, email, password, and role are required.');
    }

    const authMethod = AUTH_METHODS[role];
    if (!authMethod) {
      return ApiResponse.badRequest(res, 'Invalid role.');
    }

    const user = await User.create({
      name,
      email,
      username: username || email.split('@')[0],
      passwordHash: password,
      role,
      phone,
      company,
      authenticationMethod: authMethod.method,
      mfaEnabled: authMethod.mfa || false,
      status: status || 'ACTIVE',
    });

    const EmailService = require('../services/emailService');
    await EmailService.sendUserWelcomeEmail(user.email, user.name, user.role, password);

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user._id,
      description: `Admin created user ${user.name} with role ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.created(res, user.toJSON());
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, company, address } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found.');

    // Only admin can update other users; users can update themselves
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== user._id.toString()) {
      return ApiResponse.forbidden(res, 'You can only update your own profile.');
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (company) user.company = company;
    if (address) user.address = address;

    await user.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} updated`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, user.toJSON(), 'User updated successfully.');
  } catch (error) {
    next(error);
  }
};

// Update user status (admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return ApiResponse.badRequest(res, 'Invalid status.');
    }

    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found.');

    if (user.role === 'ADMIN' && status !== 'ACTIVE') {
      return ApiResponse.badRequest(res, 'System administrator account cannot be deactivated.');
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} status changed from ${oldStatus} to ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, user.toJSON(), 'User status updated.');
  } catch (error) {
    next(error);
  }
};

// Delete/disable user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found.');

    user.status = 'INACTIVE';
    await user.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'USER_DISABLED',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} disabled`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, null, 'User disabled successfully.');
  } catch (error) {
    next(error);
  }
};
