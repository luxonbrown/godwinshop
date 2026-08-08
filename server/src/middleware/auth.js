const { pool } = require('../config/database');

/**
 * Loads the current, fresh user row from the database (never trusts the
 * client and never trusts a stale session). Returns null if the user no
 * longer exists or the account has been disabled.
 */
async function loadUserFromDatabase(sessionUser) {
  if (!sessionUser || !sessionUser.userId) return null;
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, is_verified, status FROM users WHERE id = ?',
    [sessionUser.userId]
  );
  if (rows.length === 0) return null;
  const user = rows[0];
  if (user.status !== 'active') return null;
  return user;
}

/**
 * Requires an authenticated session. Re-checks the user's existence and
 * account status against the database on every request.
 */
async function requireAuth(req, res, next) {
  try {
    const dbUser = await loadUserFromDatabase(req.session && req.session.user);
    if (!dbUser) {
      if (req.session) req.session.destroy(() => {});
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    req.authUser = dbUser;
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires an authenticated administrator (role verified from the database). */
async function requireAdmin(req, res, next) {
  try {
    const dbUser = await loadUserFromDatabase(req.session && req.session.user);
    if (!dbUser) {
      if (req.session) req.session.destroy(() => {});
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    if (dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Administrator only.' });
    }
    req.authUser = dbUser;
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires a verified account (needed for ordering / sensitive actions). */
function requireVerified(req, res, next) {
  if (!req.authUser || req.authUser.is_verified !== 1 && req.authUser.is_verified !== true) {
    return res.status(403).json({
      message: 'Please verify your account before completing this action.',
      code: 'ACCOUNT_NOT_VERIFIED'
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireVerified, loadUserFromDatabase };