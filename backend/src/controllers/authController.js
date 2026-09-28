const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AUTH_METHODS, ROLES } = require('../config/roles');
const { OtpService, MfaService } = require('../services/authHelpers');
const AuditService = require('../services/auditService');
const ApiResponse = require('../utils/ApiResponse');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, username, password, role, phone, company } = req.body;

    if (!name || !email || !password || !role) {
      return ApiResponse.badRequest(res, 'Name, email, password, and role are required.');
    }

    if (!Object.values(ROLES).includes(role) || role === 'ADMIN') {
      return ApiResponse.badRequest(res, 'Invalid role.');
    }

    const existingUser = await User.findOne({ $or: [{ email }, ...(username ? [{ username }] : [])] });
    if (existingUser) {
      return ApiResponse.conflict(res, 'User with this email or username already exists.');
    }

    const authMethod = AUTH_METHODS[role];
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
      status: 'ACTIVE',
    });

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} registered as ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // For roles requiring OTP, initiate OTP flow
    if (authMethod.otp) {
      const otp = OtpService.generateOtp();
      user.otpCode = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await OtpService.sendOtp(user, otp);

      const partialToken = jwt.sign(
        { id: user._id, step: 'otp_pending' },
        config.jwt.secret,
        { expiresIn: '10m' }
      );

      return ApiResponse.created(res, {
        requiresOtp: true,
        tempToken: partialToken,
        userId: user._id,
        devOtp: config.otp.devMode ? otp : undefined,
      }, 'Registration successful. OTP sent for verification.');
    }

    const token = generateToken(user);

    return ApiResponse.created(res, {
      user: user.toJSON(),
      token,
      requiresMfa: !!authMethod.mfa,
    }, 'Registration successful.');
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return ApiResponse.badRequest(res, 'Credentials are required.');
    }

    const inputIdentifier = (email || username || '').trim().toLowerCase();
    const adminEmail = (config.admin.email || '').trim().toLowerCase();
    const adminUsername = (config.admin.username || '').trim().toLowerCase();

    const query = email ? { email: email.toLowerCase() } : { username: username.toLowerCase() };
    let user = await User.findOne(query);

    const inputPassword = String(password || '').trim();
    const envAdminPassword = String(config.admin.password || '').trim();

    const isAdminAttempt = (inputIdentifier && (inputIdentifier === adminEmail || inputIdentifier === adminUsername)) || (user && user.role === 'ADMIN');

    if (isAdminAttempt) {
      if (inputPassword !== envAdminPassword) {
        return ApiResponse.unauthorized(res, 'Invalid credentials.');
      }

      if (!user) {
        user = await User.findOne({ role: 'ADMIN' });
      }

      if (!user) {
        user = await User.create({
          name: 'System Administrator',
          email: config.admin.email,
          username: config.admin.username,
          passwordHash: config.admin.password,
          role: 'ADMIN',
          authenticationMethod: AUTH_METHODS.ADMIN.method,
          mfaEnabled: true,
          status: 'ACTIVE',
        });
      } else {
        // Keep DB user email and username in sync with .env
        if (user.email !== config.admin.email || user.username !== config.admin.username) {
          user.email = config.admin.email;
          user.username = config.admin.username;
          user.passwordHash = config.admin.password;
          await user.save();
        }
      }
    } else {
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid credentials.');
      }

      if (user.status !== 'ACTIVE') {
        return ApiResponse.forbidden(res, 'Account is not active.');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return ApiResponse.unauthorized(res, 'Invalid credentials.');
      }

      user.loginAttempts = 0;
      user.lockUntil = null;
    }

    const authMethod = AUTH_METHODS[user.role];

    // Check if MFA or OTP is required
    if (authMethod && authMethod.otp) {
      const otp = OtpService.generateOtp();
      user.otpCode = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await OtpService.sendOtp(user, otp);

      // Return partial token for OTP verification step
      const partialToken = jwt.sign(
        { id: user._id, step: 'otp_pending' },
        config.jwt.secret,
        { expiresIn: '10m' }
      );

      return ApiResponse.success(res, {
        requiresOtp: true,
        tempToken: partialToken,
        userId: user._id,
        devOtp: config.otp.devMode ? otp : undefined,
      }, 'OTP sent. Please verify.');
    }

    if (authMethod && authMethod.mfa) {
      const partialToken = jwt.sign(
        { id: user._id, step: 'mfa_pending' },
        config.jwt.secret,
        { expiresIn: '10m' }
      );

      return ApiResponse.success(res, {
        requiresMfa: true,
        tempToken: partialToken,
        userId: user._id,
        devMfaCode: config.mfa.devMode ? config.mfa.devCode : undefined,
      }, 'MFA verification required.');
    }

    // Direct login (no MFA/OTP required)
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} logged in`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, {
      user: user.toJSON(),
      token,
    }, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { tempToken, otp, userId } = req.body;

    if (!otp) {
      return ApiResponse.badRequest(res, 'OTP is required.');
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return ApiResponse.unauthorized(res, 'Session expired. Please login again.');
    }

    if (decoded.step !== 'otp_pending') {
      return ApiResponse.badRequest(res, 'Invalid verification step.');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    const isValid = OtpService.verifyOtp(user.otpCode, otp, user.otpExpiry);
    if (!isValid) {
      return ApiResponse.unauthorized(res, 'Invalid or expired OTP.');
    }

    // Clear OTP
    user.otpCode = null;
    user.otpExpiry = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} logged in (OTP verified)`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, {
      user: user.toJSON(),
      token,
    }, 'OTP verified. Login successful.');
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return ApiResponse.badRequest(res, 'Session token is required to resend OTP.');
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return ApiResponse.unauthorized(res, 'Session expired. Please login/register again.');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    const otp = OtpService.generateOtp();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await OtpService.sendOtp(user, otp);

    return ApiResponse.success(res, {
      devOtp: config.otp.devMode ? otp : undefined,
    }, 'A new verification code has been sent to your email.');
  } catch (error) {
    next(error);
  }
};

// Verify MFA
exports.verifyMfa = async (req, res, next) => {
  try {
    const { tempToken, mfaCode } = req.body;

    if (!mfaCode) {
      return ApiResponse.badRequest(res, 'MFA code is required.');
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return ApiResponse.unauthorized(res, 'Session expired. Please login again.');
    }

    if (decoded.step !== 'mfa_pending') {
      return ApiResponse.badRequest(res, 'Invalid verification step.');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    const isValid = MfaService.verifyToken(user.mfaSecret, mfaCode);
    if (!isValid) {
      return ApiResponse.unauthorized(res, 'Invalid MFA code.');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.name} logged in (MFA verified)`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, {
      user: user.toJSON(),
      token,
    }, 'MFA verified. Login successful.');
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res) => {
  return ApiResponse.success(res, { user: req.user });
};

// Logout
exports.logout = async (req, res) => {
  await AuditService.log({
    actor: req.user._id,
    actorName: req.user.name,
    role: req.user.role,
    action: 'USER_LOGOUT',
    entityType: 'USER',
    entityId: req.user._id,
    description: `User ${req.user.name} logged out`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return ApiResponse.success(res, null, 'Logout successful.');
};
