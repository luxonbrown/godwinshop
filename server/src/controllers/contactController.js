const { pool } = require('../config/database');
const config = require('../config/env');
const { ApiError } = require('../utils/ApiError');

/**
 * POST /api/contact — stores the message in the contact_messages table.
 * If EMAIL_ENABLED=true and SMTP credentials are configured, a copy is also
 * emailed to the support inbox; otherwise it stays in the database queue.
 */
async function submitContactMessage(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;

    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || null, message]
    );

    if (config.email.enabled) {
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
          to: process.env.SUPPORT_EMAIL || config.admin.email,
          subject: `[GodwinShop] New contact message: ${subject}`,
          text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`
        });
      } catch (err) {
        console.error('[contact] email forward failed:', err.message);
      }
    }

    res.status(201).json({ message: 'Message received. Our team will get back to you shortly.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitContactMessage };