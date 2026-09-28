const dotenv = require('dotenv');
const path = require('path');

const fs = require('fs');

const envPaths = [
  path.join(__dirname, '../../.env.example'),
  path.join(__dirname, '../.env.example'),
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend/.env'),
];

envPaths.forEach((p) => {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
});

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/reverse_auction_db',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@reverseauction.com',
  },
  otp: {
    devMode: process.env.OTP_DEV_MODE === 'true',
    devCode: process.env.OTP_DEV_CODE || '123456',
  },
  mfa: {
    devMode: process.env.MFA_DEV_MODE === 'true',
    devCode: process.env.MFA_DEV_CODE || '000000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    dir: process.env.UPLOAD_DIR || 'uploads',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@securityproject.com',
    password: process.env.ADMIN_PASSWORD || 'AdminSecurePass#2026',
    username: process.env.ADMIN_USERNAME || 'admin',
  },
};
