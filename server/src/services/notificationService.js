const { pool } = require('../config/database');

/**
 * Notification service — creates database notifications and, if email
 * sending is configured for verification, would send email copies here.
 */
async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  relatedOrderId = null
}) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, related_order_id)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, title, message, type, relatedOrderId]
  );
  return true;
}

/** Sends (in dev) or records where the notification email should be sent. */
async function createSystemNotification(payload) {
  return createNotification(payload);
}

module.exports = { createNotification, createSystemNotification };