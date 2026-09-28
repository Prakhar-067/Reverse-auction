const config = require('../config');

/**
 * OTP Service abstraction
 * In production, replace with real SMS/email OTP provider
 */
class OtpService {
  static generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOtp(user, otp) {
    const apiKey = process.env.BRAVO_API_KEY || process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'noreply@reverseauction.com';

    if (apiKey && senderEmail) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { email: senderEmail, name: 'Reverse Auction System' },
            to: [{ email: user.email, name: user.name || 'User' }],
            subject: 'Your Verification OTP Code',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #1e3a8a; margin: 0;">Reverse Auction System</h2>
                  <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Security Verification</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #334155; font-size: 16px;">Hello <strong>${user.name || 'User'}</strong>,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.5;">Use the following One-Time Password (OTP) to complete your authentication:</p>
                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
              </div>
            `
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          console.error('[BREVO ERROR]', errData);
        } else {
          console.log(`[BREVO SUCCESS] OTP ${otp} sent to ${user.email}`);
          return true;
        }
      } catch (error) {
        console.error('[BREVO EXCEPTION]', error);
      }
    }

    if (config.otp.devMode) {
      console.log(`[DEV MODE] OTP for ${user.email}: ${otp}`);
      return true;
    }

    console.log(`OTP sent to ${user.email}: ${otp}`);
    return true;
  }

  static verifyOtp(storedOtp, providedOtp, expiry) {
    if (storedOtp && providedOtp === storedOtp) {
      if (!expiry || new Date() <= new Date(expiry)) return true;
    }
    if (config.otp.devMode && providedOtp === config.otp.devCode) {
      return true;
    }
    return false;
  }
}

/**
 * MFA Service abstraction
 * In production, replace with real TOTP provider (e.g., Google Authenticator)
 */
class MfaService {
  static generateSecret() {
    if (config.mfa.devMode) {
      return 'DEV_MFA_SECRET';
    }
    // In production, use speakeasy or similar
    return 'MFA_SECRET_' + Math.random().toString(36).substring(2);
  }

  static verifyToken(secret, token) {
    if (config.mfa.devMode) {
      return token === config.mfa.devCode;
    }
    // In production, use speakeasy.totp.verify()
    return false;
  }
}

module.exports = { OtpService, MfaService };
