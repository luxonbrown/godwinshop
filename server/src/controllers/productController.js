const { pool } = require('../config/database');
const { deleteUploadedFile } = require('../middleware/upload');
const { ApiError } = require('../utils/ApiError');

const EFFECTIVE_PRICE = `COALESCE(NULLIF(products.discount_price, 0), products.price)`;

const LIST_SELECT = `
  SELECT products.id, products.name, products.description, products.price,
         products.discount_price, products.sku, products.stock_quantity,
         products.image_url, products.status, products.category_id,
         products.created_at, products.updated_at,
         categories.name AS category_name,
         ${EFFECTIVE_PRICE} AS effective_price
  FROM products
  LEFT JOIN categories ON categories.id = products.category_id`;

function parseBool(value) {
  return value === 'true' || value === '1';
}

/** Public catalogue listing — only active products, with filters/sort/pagination. */
async function listProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 60);
    const search = (req.query.search || '').trim();
    const categoryId = parseInt(req.query.category_id || '', 10);
    const minPrice = parseFloat(req.query.min_price || '');
    const maxPrice = parseFloat(req.query.max_price || '');
    const includeInactive = parseBool(req.query.include_inactive);
    const sort = req.query.sort || 'newest';

    const where = [];
    const params = [];
    if (!includeInactive) where.push('products.status = ?'), params.push('active');
    if (search) {
      where.push('(products.name LIKE ? OR products.description LIKE ? OR products.sku LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (categoryId) {
      where.push('products.category_id = ?');
      params.push(categoryId);
    }
    if (!Number.isNaN(minPrice)) {
      where.push(`${EFFECTIVE_PRICE} >= ?`);
      params.push(minPrice);
    }
    if (!Number.isNaN(maxPrice)) {
      where.push(`${EFFECTIVE_PRICE} <= ?`);
      params.push(maxPrice);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const orderBy =
      sort === 'price_asc' ? `${EFFECTIVE_PRICE} ASC`
      : sort === 'price_desc' ? `${EFFECTIVE_PRICE} DESC`
      : sort === 'name' ? 'products.name ASC'
      : 'products.created_at DESC';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `${LIST_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      products: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(`${LIST_SELECT} WHERE products.id = ?`, [id]);
    if (rows.length === 0) throw new ApiError(404, 'Product not found.');
    const product = rows[0];

    const [related] = await pool.query(
      `${LIST_SELECT} WHERE products.category_id = ? AND products.id <> ? AND products.status = 'active'
       ORDER BY products.created_at DESC LIMIT 4`,
      [product.category_id, id]
    );

    res.json({ product, related_products: related });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, price, discount_price, category_id, sku, stock_quantity, status } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [category] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (category.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);
      throw new ApiError(422, 'Selected category does not exist.');
    }

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, description, price, discount_price, sku, stock_quantity, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id, name, description || null, price,
        discount_price || null, sku, stock_quantity, image_url,
        status || (stock_quantity > 0 ? 'active' : 'out_of_stock')
      ]
    );

    const [rows] = await pool.query(`${LIST_SELECT} WHERE products.id = ?`, [result.insertId]);
    res.status(201).json({ message: 'Product created successfully.', product: rows[0] });
  } catch (err) {
    if (req.file) deleteUploadedFile(req.file.filename);
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, price, discount_price, category_id, sku, stock_quantity, status } = req.body;

    const [existing] = await pool.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);
      throw new ApiError(404, 'Product not found.');
    }

    if (category_id) {
      const [category] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (category.length === 0) {
        if (req.file) deleteUploadedFile(req.file.filename);
        throw new ApiError(422, 'Selected category does not exist.');
      }
    }

    let image_url = existing[0].image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
      if (existing[0].image_url) deleteUploadedFile(existing[0].image_url);
    }

    // Stock-aware status handling: zero stock always means out of stock.
    const effectiveStatus =
      stock_quantity === 0 && status !== 'inactive' ? 'out_of_stock'
      : stock_quantity > 0 && status === 'out_of_stock' ? 'active'
      : status || 'active';

    await pool.query(
      `UPDATE products SET name = ?, description = ?, price = ?, discount_price = ?,
              category_id = ?, sku = ?, stock_quantity = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        name, description || null, price, discount_price || null, category_id,
        sku, stock_quantity, image_url, effectiveStatus, id
      ]
    );

    const [rows] = await pool.query(`${LIST_SELECT} WHERE products.id = ?`, [id]);
    res.json({ message: 'Product updated successfully.', product: rows[0] });
  } catch (err) {
    if (req.file) deleteUploadedFile(req.file.filename);
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await pool.query(
      `SELECT p.id, p.image_url, COUNT(oi.id) AS item_count
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );
    if (existing.length === 0) throw new ApiError(404, 'Product not found.');

    if (existing[0].item_count > 0) {
      throw new ApiError(
        409,
        'This product has order history and cannot be deleted. Set it to inactive instead.',
        'PRODUCT_IN_USE'
      );
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (existing[0].image_url) deleteUploadedFile(existing[0].image_url);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };