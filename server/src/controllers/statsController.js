const { pool } = require('../config/database');

/** Metrics for the admin dashboard. */
async function getStats(req, res, next) {
  try {
    const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users WHERE role = ?', ['customer']);
    const [[{ products }]] = await pool.query('SELECT COUNT(*) AS products FROM products');
    const [[{ orders }]] = await pool.query('SELECT COUNT(*) AS orders FROM orders');
    const [[{ pending }]] = await pool.query("SELECT COUNT(*) AS pending FROM orders WHERE status = 'pending'");
    const [[{ delivered }]] = await pool.query("SELECT COUNT(*) AS delivered FROM orders WHERE status = 'delivered'");
    const [[{ revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status <> 'cancelled'"
    );
    const [[{ today_orders }]] = await pool.query(
      'SELECT COUNT(*) AS today_orders FROM orders WHERE DATE(created_at) = CURDATE()'
    );
    const [[{ unread_notifications }]] = await pool.query(
      'SELECT COUNT(*) AS unread_notifications FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.authUser.id]
    );

    const [statusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    const [lowStock] = await pool.query(
      `SELECT id, name, sku, stock_quantity, status FROM products
       WHERE stock_quantity <= 5 ORDER BY stock_quantity ASC LIMIT 6`
    );

    const [recentOrders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
              u.full_name AS customer_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 6`
    );

    const [customers] = await pool.query(
      'SELECT COUNT(*) AS count FROM users WHERE role = ? AND status = ?',
      ['customer', 'active']
    );

    res.json({
      stats: {
        users,
        active_customers: customers[0].count,
        products,
        orders,
        pending_orders: pending,
        delivered_orders: delivered,
        revenue: Number(revenue),
        today_orders,
        unread_notifications
      },
      status_breakdown: statusBreakdown,
      low_stock: lowStock,
      recent_orders: recentOrders
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };