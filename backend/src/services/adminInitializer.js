const User = require('../models/User');
const config = require('../config');
const { AUTH_METHODS, ROLES } = require('../config/roles');

/**
 * Ensures the admin user exists and enforces credentials from .env file
 */
const ensureAdminUser = async () => {
  try {
    const adminEmail = config.admin.email;
    const adminPassword = config.admin.password;
    const adminUsername = config.admin.username;

    let adminUser = await User.findOne({ role: ROLES.ADMIN });

    if (!adminUser) {
      adminUser = await User.findOne({ $or: [{ email: adminEmail }, { username: adminUsername }] });
    }

    if (!adminUser) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        username: adminUsername,
        passwordHash: adminPassword,
        role: ROLES.ADMIN,
        authenticationMethod: AUTH_METHODS.ADMIN.method,
        mfaEnabled: true,
        mfaSecret: 'DEV_MFA_SECRET',
        status: 'ACTIVE',
      });
      console.log(`✅ Default Admin created from .env (${adminEmail})`);
    } else {
      adminUser.email = adminEmail;
      adminUser.username = adminUsername;
      adminUser.passwordHash = adminPassword;
      adminUser.status = 'ACTIVE';
      await adminUser.save();
      console.log(`✅ Admin credentials synchronized & activated from .env (${adminEmail})`);
    }
  } catch (error) {
    console.error('Error initializing admin user from .env:', error.message);
  }
};

module.exports = { ensureAdminUser };
