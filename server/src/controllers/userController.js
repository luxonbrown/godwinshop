const { pool, withTransaction } = require('../config/database');
const { deleteUploadedFile } = require('../middleware/upload');
const { ApiError } = require('../utils/ApiError');

const PUBLIC_FIELDS = `id, full_name, email, phone, role, is_verified, status,
  profile_image, address, city, created_at, updated_at`;

function toPublicUser(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    is_verified: row.is_verified === 1 || row.is_verified === true,
    status: row.status,
    profile_image: row.profile_image,
    address: row.address,
    city: row.city,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.authUser.id]);
    if (rows.length === 0) throw new ApiError(404, 'User not found.');
    const [orderCount] = await pool.query('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [req.authUser.id]);
    res.json({ user: { ...toPublicUser(rows[0]), order_count: orderCount[0].count } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { full_name, phone, address, city } = req.body;
    const { profileImage } = req.files || {};

    const [current] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [req.authUser.id]);
    if (current.length === 0) throw new ApiError(404, 'User not found.');

    let imageUrl = null;
    if (profileImage && profileImage[0]) {
      imageUrl = `/uploads/${profileImage[0].filename}`;
      if (current[0].profile_image) deleteUploadedFile(current[0].profile_image);
    } else if (req.body.image_url === 'remove') {
      if (current[0].profile_image) deleteUploadedFile(current[0].profile_image);
      imageUrl = null;
    } else {
      imageUrl = current[0].profile_image;
    }

    await pool.query(
      `UPDATE users SET full_name = ?, phone = ?, address = ?, city = ?, profile_image = ?
       WHERE id = ?`,
      [full_name || req.authUser.full_name, phone ?? req.authUser.phone, address ?? null, city ?? null, imageUrl, req.authUser.id]
    );

    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.authUser.id]);
    res.json({ message: 'Profile updated successfully.', user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin — customer management
// ---------------------------------------------------------------------------

async function listUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const search = (req.query.search || '').trim();
    const role = req.query.role || '';

    const where = [];
    const params = [];
    if (role) {
      where.push('role = ?');
      params.push(role);
    }
    if (search) {
      where.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_verified, u.status,
              u.created_at, COUNT(o.id) AS order_count
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       ${whereSql}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      users: rows.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        is_verified: r.is_verified === 1,
        status: r.status,
        order_count: r.order_count,
        created_at: r.created_at
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (status !== 'active' && status !== 'disabled') {
      throw new ApiError(422, 'Status must be active or disabled.');
    }
    if (id === req.authUser.id) throw new ApiError(400, 'You cannot change your own account status.');

    const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) throw new ApiError(404, 'Customer not found.');
    if (rows[0].role === 'admin') throw new ApiError(400, 'Administrator accounts cannot be disabled.');

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    // Immediately invalidate the customer's active sessions.
    await pool.query(`DELETE FROM sessions WHERE data LIKE CONCAT('%"userId":', ?, '%')`, [id]);

    res.json({ message: status === 'disabled' ? 'Customer account disabled.' : 'Customer account re-enabled.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, listUsers, toggleUserStatus };