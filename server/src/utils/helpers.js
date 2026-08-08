const crypto = require('crypto');

/** Random opaque token (only its SHA-256 hash is stored in the database). */
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Order number: GS-YYYYMMDD-XXXX (sequential per day, zero-padded). */
function formatOrderNumber(dateStr, seq) {
  return `GS-${dateStr.replace(/-/g, '')}-${String(seq).padStart(4, '0')}`;
}

/** Compact date string e.g. '2026-08-08'. */
function todayString() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Format DATE as '15 August 2026'. */
function formatDeliveryDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

module.exports = { randomToken, hashToken, formatOrderNumber, todayString, formatDeliveryDate };