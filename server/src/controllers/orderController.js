const { pool, withTransaction } = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { ApiError } = require('../utils/ApiError');
const { formatOrderNumber, todayString } = require('../utils/helpers');
const config = require('../config/env');

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'ready_for_delivery',
  'out_for_delivery', 'delivered', 'cancelled'
];

const PUBLIC_STATUSES = ['active'];

/** Effective product price (discount wins when set and non-zero). */
function effectivePrice(row) {
  return row.discount_price && Number(row.discount_price) > 0
    ? Number(row.discount_price)
    : Number(row.price);
}

const ORDER_SELECT = `
  SELECT o.id, o.order_number, o.user_id, o.subtotal, o.delivery_fee, o.total_amount,
         o.delivery_address, o.delivery_city, o.delivery_phone, o.delivery_instructions,
         o.status, o.expected_delivery_date, o.created_at, o.updated_at,
         u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
  FROM orders o
  JOIN users u ON u.id = o.user_id`;

async function getOrderItems(orderId) {
  const [items] = await pool.query(
    `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
            p.name AS product_name, p.image_url, p.sku
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return items;
}

/** Fetch order + items. `scope` may be 'customer' (ownership enforced) or 'admin'. */
async function fetchOrder(orderId, scope, userId) {
  const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [orderId]);
  if (rows.length === 0) return null;
  const order = rows[0];
  if (scope === 'customer' && order.user_id !== userId) return null;
  order.items = await getOrderItems(orderId);
  return order;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

async function createOrder(req, res, next) {
  try {
    const { items, delivery_address, delivery_city, delivery_phone, delivery_instructions } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(422, 'Your cart is empty.', 'EMPTY_CART');
    }
    if (!delivery_address || !delivery_address.trim() || !delivery_phone || !delivery_phone.trim()) {
      throw new ApiError(422, 'Delivery address and phone number are required.', 'DELIVERY_REQUIRED');
    }

    const order = await withTransaction(async (conn) => {
      // 1. Lock the product rows so stock cannot change concurrently.
      const productIds = [...new Set(items.map((i) => parseInt(i.product_id, 10)))];
      if (productIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw new ApiError(422, 'Invalid product in cart.', 'BAD_PRODUCT');
      }
      const placeholders = productIds.map(() => '?').join(',');
      const [productRows] = await conn.query(
        `SELECT id, name, price, discount_price, stock_quantity, status
         FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
        productIds
      );
      const productsById = new Map(productRows.map((p) => [p.id, p]));

      if (productRows.length !== productIds.length) {
        throw new ApiError(422, 'Some products are no longer available.', 'PRODUCT_UNAVAILABLE');
      }

      // 2. Validate quantities against stock and calculate server-side prices.
      const quantityMap = new Map();
      let subtotal = 0;
      const orderItems = [];
      for (const item of items) {
        const productId = parseInt(item.product_id, 10);
        const qty = parseInt(item.quantity, 10);
        if (!Number.isInteger(qty) || qty <= 0) throw new ApiError(422, 'Invalid quantity.', 'BAD_QUANTITY');
        const product = productsById.get(productId);
        if (!product || product.status !== 'active') {
          throw new ApiError(422, `"${product ? product.name : 'Product'}" is no longer available.`, 'PRODUCT_UNAVAILABLE');
        }
        if (product.stock_quantity < qty) {
          throw new ApiError(409, `Only ${product.stock_quantity} of "${product.name}" left in stock.`, 'INSUFFICIENT_STOCK');
        }
        const price = effectivePrice(product);
        const existing = quantityMap.get(productId);
        if (existing) {
          if (existing.quantity + qty > product.stock_quantity) {
            throw new ApiError(409, `Only ${product.stock_quantity} of "${product.name}" left in stock.`, 'INSUFFICIENT_STOCK');
          }
          existing.quantity += qty;
          existing.subtotal += price * qty;
        } else {
          quantityMap.set(productId, { quantity: qty, subtotal: price * qty });
        }
        subtotal += price * qty;
        orderItems.push({ productId, qty, price });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const deliveryFee =
        subtotal >= config.delivery.freeThreshold ? 0 : config.delivery.fee;
      const total = Math.round((subtotal + deliveryFee) * 100) / 100;

      // 3. Unique order number (per-day sequence inside the same transaction).
      const dateStr = todayString();
      await conn.query(
        `INSERT INTO order_sequences (seq_date, seq_value) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE seq_value = LAST_INSERT_ID(seq_value + 1)`,
        [dateStr]
      );
      const [seqRows] = await conn.query('SELECT LAST_INSERT_ID() AS seq');
      const orderNumber = formatOrderNumber(dateStr, seqRows[0].seq);

      // 4. Insert order + items.
      const [orderResult] = await conn.query(
        `INSERT INTO orders (order_number, user_id, subtotal, delivery_fee, total_amount,
                             delivery_address, delivery_city, delivery_phone, delivery_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, req.authUser.id, subtotal, deliveryFee, total,
          delivery_address.trim(), delivery_city || null,
          delivery_phone.trim(), delivery_instructions || null
        ]
      );
      const orderId = orderResult.insertId;

      for (const item of orderItems) {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.qty, item.price, Math.round(item.price * item.qty * 100) / 100]
        );
      }

      // 5. Decrement inventory (guarded update — cannot go negative).
      for (const item of orderItems) {
        const [updateResult] = await conn.query(
          `UPDATE products SET stock_quantity = stock_quantity - ?
           WHERE id = ? AND stock_quantity >= ?`,
          [item.qty, item.productId, item.qty]
        );
        if (updateResult.affectedRows === 0) {
          throw new ApiError(409, 'Stock changed while placing your order. Please try again.', 'STOCK_RACE');
        }
        await conn.query(
          `UPDATE products SET status = 'out_of_stock' WHERE id = ? AND stock_quantity = 0 AND status <> 'inactive'`,
          [item.productId]
        );
      }

      return { orderId, orderNumber, subtotal, deliveryFee, total };
    });

    // Notifications (after commit so no partial notifications on rollback).
    const [orderRow] = await pool.query(
      `${ORDER_SELECT} WHERE o.id = ?`,
      [order.orderId]
    );
    const placedOrder = orderRow[0];
    placedOrder.items = await getOrderItems(placedOrder.orderId);

    await createNotification({
      userId: req.authUser.id,
      title: 'Order placed',
      message: `Order ${placedOrder.orderNumber} was received. We'll notify you as it progresses.`,
      type: 'order',
      relatedOrderId: placedOrder.orderId
    });

    const [admins] = await pool.query('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'New order received',
        message: `Order ${placedOrder.orderNumber} from ${req.authUser.full_name} is waiting for confirmation.`,
        type: 'order',
        relatedOrderId: placedOrder.orderId
      });
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      order: { ...placedOrder, items: placedOrder.items }
    });
  } catch (err) {
    next(err);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM orders WHERE user_id = ?',
      [req.authUser.id]
    );
    const [rows] = await pool.query(
      `${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [req.authUser.id, limit, (page - 1) * limit]
    );

    res.json({
      orders: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    next(err);
  }
}

async function getMyOrder(req, res, next) {
  try {
    const order = await fetchOrder(parseInt(req.params.id, 10), 'customer', req.authUser.id);
    if (!order) throw new ApiError(404, 'Order not found.');
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

/** Customer may cancel their own order while it is still pending. */
async function cancelMyOrder(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await fetchOrder(orderId, 'customer', req.authUser.id);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.status !== 'pending') {
      throw new ApiError(400, 'Only pending orders can be cancelled.', 'NOT_CANCELLABLE');
    }

    await withTransaction(async (conn) => {
      await conn.query(`UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'`, [orderId]);
      // Restore stock.
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        await conn.query(`UPDATE products SET status = 'active' WHERE id = ? AND status = 'out_of_stock' AND stock_quantity > 0`, [item.product_id]);
      }
    });

    await createNotification({
      userId: req.authUser.id,
      title: 'Order cancelled',
      message: `Order ${order.order_number} was cancelled.`,
      type: 'order',
      relatedOrderId: orderId
    });
    const [admins] = await pool.query('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Order cancelled by customer',
        message: `Order ${order.order_number} was cancelled by the customer.`,
        type: 'order',
        relatedOrderId: orderId
      });
    }

    res.json({ message: 'Order cancelled.' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function listAllOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
    const status = req.query.status || '';
    const search = (req.query.search || '').trim();

    const where = [];
    const params = [];
    if (status && ORDER_STATUSES.includes(status)) {
      where.push('o.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR o.delivery_phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `${ORDER_SELECT} ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      orders: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    next(err);
  }
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const FORWARD_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_delivery'],
  ready_for_delivery: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

async function updateOrderStatus(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) throw new ApiError(422, 'Invalid order status.');

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) throw new ApiError(404, 'Order not found.');
    const order = rows[0];

    if (status === order.status) {
      return res.json({ message: 'Order status is already up to date.', order });
    }
    const allowed = FORWARD_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Cannot move an order from "${STATUS_LABELS[order.status]}" to "${STATUS_LABELS[status]}".`);
    }

    if (status === 'cancelled') {
      await withTransaction(async (conn) => {
        await conn.query('UPDATE orders SET status = ?, expected_delivery_date = NULL WHERE id = ?', ['cancelled', orderId]);
        const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
          await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
          await conn.query(`UPDATE products SET status = 'active' WHERE id = ? AND status = 'out_of_stock' AND stock_quantity > 0`, [item.product_id]);
        }
      });
    } else {
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    }

    await createNotification({
      userId: order.user_id,
      title: `Order ${STATUS_LABELS[status]}`,
      message: `Your order ${order.order_number} is now ${STATUS_LABELS[status].toLowerCase()}.`,
      type: 'order',
      relatedOrderId: orderId
    });

    const updated = await fetchOrder(orderId, 'admin', null);
    res.json({ message: `Order status updated to "${STATUS_LABELS[status]}".`, order: updated });
  } catch (err) {
    next(err);
  }
}

async function setDeliveryDate(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { date } = req.body;

    if (!date) throw new ApiError(422, 'A delivery date is required.');
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) throw new ApiError(422, 'Invalid delivery date.');

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) throw new ApiError(404, 'Order not found.');
    const order = rows[0];
    if (order.status === 'cancelled' || order.status === 'delivered') {
      throw new ApiError(400, 'Delivery date cannot be changed on cancelled or delivered orders.');
    }

    const changed = order.expected_delivery_date !== date;
    await pool.query('UPDATE orders SET expected_delivery_date = ? WHERE id = ?', [date, orderId]);

    const notificationTitle = order.expected_delivery_date ? 'Delivery date changed' : 'Delivery date assigned';
    const notificationMessage = changed
      ? `Your expected delivery date for order ${order.order_number} is now ${date}.`
      : `Your expected delivery date for order ${order.order_number} is ${date}.`;

    if (changed || !order.expected_delivery_date) {
      await createNotification({
        userId: order.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'order',
        relatedOrderId: orderId
      });
    }

    const updated = await fetchOrder(orderId, 'admin', null);
    res.json({ message: 'Expected delivery date updated.', order: updated });
  } catch (err) {
    next(err);
  }
}

async function getAdminOrder(req, res, next) {
  try {
    const order = await fetchOrder(parseInt(req.params.id, 10), 'admin', null);
    if (!order) throw new ApiError(404, 'Order not found.');
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  listAllOrders,
  updateOrderStatus,
  setDeliveryDate,
  getAdminOrder,
  ORDER_STATUSES,
  STATUS_LABELS
};