const { pool } = require('../config/database');
const { ApiError } = require('../utils/ApiError');

/** Current user's notifications. */
async function listMine(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '15', 10), 1), 50);
    const unreadOnly = req.query.filter === 'unread';

    const where = ['n.user_id = ?'];
    const params = [req.authUser.id];
    if (unread) {
      where.push('n.is_read = 0');
    }
    const whereSql = where.join(' AND ');

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications n WHERE ${whereSql}`,
      params
    );
    const [[{ unread_count }]] = await pool.query(
      `SELECT COUNT(*) AS unread_count FROM notifications n WHERE n.user_id = ? AND n.is_read = 0`,
      [req.authUser.id]
    );
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.type, n.related_order_id, n.is_read, n.created_at,
              o.order_number
       FROM notifications n
       LEFT JOIN orders o ON o.id = n.related_order_id
       WHERE ${whereSql}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({ notifications: rows, total, unread_count, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.authUser.id]
    );
    res.json({ unread: count });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.authUser.id]
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Notification not found.');
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.authUser.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.authUser.id]
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Notification not found.');
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMine, unreadCount, markRead, markAllRead, deleteNotification };