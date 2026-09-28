const config = require('../config');

/**
 * Email Service abstraction using Brevo API
 */
class EmailService {
  static async sendEmail({ to, subject, text, html }) {
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
            to: [{ email: to }],
            subject: subject,
            htmlContent: html || `<p>${text}</p>`,
            textContent: text
          })
        });

        if (response.ok) {
          console.log(`[BREVO SUCCESS] Email sent to ${to}: ${subject}`);
          return true;
        } else {
          const errData = await response.json().catch(() => null);
          console.error('[BREVO ERROR]', errData);
        }
      } catch (error) {
        console.error('[BREVO EXCEPTION]', error);
      }
    }

    console.log(`[EMAIL DEV] To: ${to}, Subject: ${subject}`);
    return true;
  }

  static async sendUserWelcomeEmail(email, name, role, password) {
    return EmailService.sendEmail({
      to: email,
      subject: 'Welcome to Reverse Auction System - Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Welcome, ${name || 'User'}!</h2>
          <p style="color: #334155;">Your account has been created with the role <strong>${role}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
            <p style="margin: 4px 0; color: #475569;"><strong>Email:</strong> ${email}</p>
            ${password ? `<p style="margin: 4px 0; color: #475569;"><strong>Password:</strong> ${password}</p>` : ''}
          </div>
          <p style="color: #64748b; font-size: 13px;">Please keep your credentials safe and sign in to the platform.</p>
        </div>
      `
    });
  }

  static async sendOtpEmail(email, otp) {
    return EmailService.sendEmail({
      to: email,
      subject: 'Verification Code - Reverse Auction System',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    });
  }

  static async sendNotificationEmail(email, title, message) {
    return EmailService.sendEmail({
      to: email,
      subject: title,
      text: message,
    });
  }
}

module.exports = EmailService;
