const config = require('../config/env');
const { pool } = require('../config/database');

/**
 * Email abstraction.
 *
 * EMAIL_ENABLED=false (default for local development):
 *   - No external service is contacted.
 *   - Verification links are printed to the server console and also returned
 *     by the API in development so the UI can display them.
 *
 * EMAIL_ENABLED=true:
 *   Add the SMTP credentials in server/.env (EMAIL_HOST, EMAIL_USER,
 *   EMAIL_PASS) and verification emails will be sent for real.
 */
const devVerificationUrl = (token) =>
  `${config.clientUrl}/verify?token=${token}`;

async function sendVerificationEmail(toEmail, toName, token) {
  const url = devVerificationUrl(token);
  if (!config.email.enabled) {
    console.log(`\n[GodwinShop] Verification link for ${toEmail} (${toName}):\n  ${url}\n`);
    return { delivered: false, url };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass }
    });
    await transporter.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: 'Verify your GodwinShop account',
      html: `
        <p>Hi ${toName},</p>
        <p>Welcome to GodwinShop. Confirm your email address to start ordering:</p>
        <p><a href="${url}">Verify my account</a></p>
        <p>If the button does not work, open this link: ${url}</p>
      `
    });
    return { delivered: true, url };
  } catch (err) {
    console.error('[EmailService] failed to send verification email:', err.message);
    return { delivered: false, url };
  }
}

module.exports = { sendVerificationEmail, devVerificationUrl };