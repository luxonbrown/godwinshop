const { pool } = require('../config/database');
const { ApiError } = require('../utils/ApiError');

async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
              COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
              COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );
    if (rows.length === 0) throw new ApiError(404, 'Category not found.');
    res.json({ category: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, c.updated_at, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
       WHERE c.id = ? GROUP BY c.id`,
      [result.insertId]
    );
    res.status(201).json({ message: 'Category created successfully.', category: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) throw new ApiError(404, 'Category not found.');

    await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [
      name, description ?? null, id
    ]);

    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, c.updated_at, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
       WHERE c.id = ? GROUP BY c.id`,
      [id]
    );
    res.json({ message: 'Category updated successfully.', category: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE category_id = ?', [id]);
    if (rows[0].count > 0) {
      throw new ApiError(
        409,
        `Cannot delete: ${rows[0].count} product(s) belong to this category. Move or delete them first.`,
        'CATEGORY_IN_USE'
      );
    }
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError(404, 'Category not found.');
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };