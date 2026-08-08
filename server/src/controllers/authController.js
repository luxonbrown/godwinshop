const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('../config/database');
const { sendVerificationEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { randomToken, hashToken } = require('../utils/helpers');
const { ApiError } = require('../utils/ApiError');
const config = require('../config/env');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function toPublicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_verified: user.is_verified === 1 || user.is_verified === true,
    status: user.status,
    profile_image: user.profile_image,
    address: user.address,
    city: user.city,
    created_at: user.created_at
  };
}

/** Creates a one-time verification token row; returns the raw token. */
async function issueToken(userId) {
  const token = randomToken();
  await pool.query(
    `INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
     VALUES (?, ?, 'verify_account', DATE_ADD(NOW(), INTERVAL ? SECOND))`,
    [userId, hashToken(token), Math.floor(VERIFICATION_TTL_MS / 1000)]
  );
  return token;
}

/** Dev-only convenience: real verification links are emailed when configured. */
function devUrlFor(token) {
  if (!config.email.enabled && !config.isProd) {
    return `${config.clientUrl}/verify?token=${token}`;
  }
  return null;
}

async function register(req, res, next) {
  try {
    const { full_name, email, phone, password } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [full_name, email, phone || null, passwordHash]
    );

    const token = await issueToken(result.insertId);
    const emailResult = await sendVerificationEmail(email, full_name, token);

    res.status(201).json({
      message: 'Account created. Please verify your email to start ordering.',
      user: toPublicUser({
        id: result.insertId,
        full_name,
        email,
        phone,
        role: 'customer',
        is_verified: 0,
        status: 'active'
      }),
      devVerificationUrl: devUrlFor(token),
      emailDelivered: emailResult.delivered
    });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) throw new ApiError(422, 'Verification token is required.', 'TOKEN_REQUIRED');

    const tokenHash = hashToken(token);
    const [rows] = await pool.query(
      `SELECT vt.id, vt.user_id, vt.used, vt.expires_at, u.is_verified
       FROM verification_tokens vt
       JOIN users u ON u.id = vt.user_id
       WHERE vt.token_hash = ? AND vt.purpose = 'verify_account'`,
      [tokenHash]
    );
    if (rows.length === 0) throw new ApiError(400, 'Invalid or expired verification link.', 'INVALID_TOKEN');

    const row = rows[0];
    if (row.used === 1) throw new ApiError(400, 'This verification link has already been used.', 'TOKEN_USED');
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new ApiError(400, 'This verification link has expired. Request a new one.', 'TOKEN_EXPIRED');
    }
    if (row.is_verified === 1) {
      await pool.query('UPDATE verification_tokens SET used = 1 WHERE id = ?', [row.id]);
      return res.json({ message: 'Account is already verified.', verified: true });
    }

    await withTransaction(async (conn) => {
      await conn.query('UPDATE users SET is_verified = 1 WHERE id = ?', [row.user_id]);
      await conn.query('UPDATE verification_tokens SET used = 1 WHERE id = ?', [row.id]);
    });

    await createNotification({
      userId: row.user_id,
      title: 'Account verified',
      message: 'Your GodwinShop account is verified. You can now place orders.',
      type: 'account'
    });

    res.json({ message: 'Account verified successfully. You can now sign in.', verified: true });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required.', 'EMAIL_REQUIRED');

    const [rows] = await pool.query(
      'SELECT id, full_name, email, is_verified FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) throw new ApiError(404, 'No account found with that email.', 'NOT_FOUND');
    const user = rows[0];
    if (user.is_verified === 1) throw new ApiError(400, 'This account is already verified.', 'ALREADY_VERIFIED');

    const token = await issueToken(user.id);
    await sendVerificationEmail(user.email, user.full_name, token);

    res.json({
      message: 'A new verification link has been generated.',
      devVerificationUrl: devUrlFor(token)
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, role, is_verified, status,
              profile_image, address, city, created_at
       FROM users WHERE email = ?`,
      [email]
    );
    if (rows.length === 0) throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');

    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    if (user.status !== 'active') {
      throw new ApiError(403, 'This account has been disabled. Contact support.', 'ACCOUNT_DISABLED');
    }

    // Session-fixation protection: always issue a fresh session id after login.
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.user = {
      userId: user.id,
      role: user.role,
      isVerified: user.is_verified === 1
    };

    res.json({ message: 'Signed in successfully.', user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function session(req, res, next) {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.json({ authenticated: false });

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, role, is_verified, status, profile_image,
              address, city, created_at
       FROM users WHERE id = ?`,
      [sessionUser.userId]
    );
    if (rows.length === 0) {
      return req.session.destroy(() => res.json({ authenticated: false }));
    }
    const user = rows[0];
    if (user.status !== 'active') {
      return req.session.destroy(() => res.json({ authenticated: false }));
    }

    const [unread] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [user.id]
    );

    res.json({ authenticated: true, user: toPublicUser(user), unread: unread[0].count });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, role, is_verified, status, profile_image,
              address, city, created_at
       FROM users WHERE id = ?`,
      [req.authUser.id]
    );
    if (rows.length === 0) throw new ApiError(404, 'User not found.');

    const [orderCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM orders WHERE user_id = ?',
      [req.authUser.id]
    );

    res.json({ user: { ...toPublicUser(rows[0]), order_count: orderCount[0].count } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('Logout session destroy error:', err.message);
    res.clearCookie('godwinshop.sid', { path: '/' });
    res.json({ message: 'Signed out successfully.' });
  });
}

/** Change password: verifies current password and invalidates other sessions. */
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.authUser.id]);
    if (rows.length === 0) throw new ApiError(404, 'User not found.');

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) throw new ApiError(400, 'Current password is incorrect.', 'WRONG_PASSWORD');

    const passwordHash = await bcrypt.hash(new_password, 12);
    await withTransaction(async (conn) => {
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.authUser.id]);
      // Invalidate every other active session for this user (JSON-serialized data).
      await conn.query(
        `DELETE FROM sessions WHERE data LIKE CONCAT('%"userId":', ?, '%') AND session_id <> ?`,
        [req.authUser.id, req.sessionID]
      );
    });

    await createNotification({
      userId: req.authUser.id,
      title: 'Password changed',
      message: 'Your password was updated. Other devices were signed out.',
      type: 'account'
    });

    res.json({ message: 'Password updated successfully. Other sessions were signed out.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verify, resendVerification, login, session, me, logout, changePassword };