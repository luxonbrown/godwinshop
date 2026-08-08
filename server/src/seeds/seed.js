const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * `npm run seed`
 *
 * Seeds development data: categories, products and a demo customer.
 * Safe to re-run (skips rows that already exist).
 */

const CATEGORIES = [
  { name: 'Electronics', description: 'Smartphones, accessories and everyday electronics.' },
  { name: 'Fashion', description: 'Clothing, footwear and accessories for everyone.' },
  { name: 'Home & Living', description: 'Furniture, decor and kitchen essentials.' },
  { name: 'Beauty & Care', description: 'Skincare, haircare and personal grooming.' },
  { name: 'Books & Stationery', description: 'Bestsellers, notebooks and writing essentials.' },
  { name: 'Sports & Outdoors', description: 'Fitness gear, sports equipment and outdoor kits.' },
  { name: 'Groceries', description: 'Daily essentials and fresh pantry staples.' }
];

const PRODUCTS = [
  { name: 'Aurus Classic Cotton T-Shirt', sku: 'GSE-1001', price: 16500, discount: 12500, stock: 40, category: 'Fashion', description: 'Classic crew-neck cotton T-shirt with a relaxed fit — soft, breathable and made to last through everyday wear.', image: '/uploads/shirt-1.jpeg' },
  { name: 'Aurus Slim Chino Pants', sku: 'GSE-1002', price: 32000, discount: 27500, stock: 35, category: 'Fashion', description: 'Slim-fit chino pants in stretch cotton twill — smart enough for the office, comfortable enough for weekends.', image: '/uploads/pant-1.jpeg' },
  { name: 'Volt 20W Fast Charger', sku: 'GSE-1003', price: 18500, discount: 0, stock: 120, category: 'Electronics', description: 'Compact 20W USB-C fast charger with smart overheat and surge protection.' },
  { name: 'Novapad 11 Tablet', sku: 'GSE-1004', price: 265000, discount: 239000, stock: 18, category: 'Electronics', description: '11-inch 2K display tablet with 128GB storage, quad speakers and all-day battery.' },
  { name: 'Urban Denim Jacket', sku: 'GSF-2001', price: 62000, discount: 0, stock: 30, category: 'Fashion', description: 'Classic slim-fit denim jacket in premium stretch denim with brushed inner lining.' },
  { name: 'Classic White Sneakers', sku: 'GSF-2002', price: 54000, discount: 47000, stock: 44, category: 'Fashion', description: 'Minimalist white sneakers with cushioned insole and durable rubber outsole.' },
  { name: 'Grid Backpack 25L', sku: 'GSF-2003', price: 38000, discount: 32500, stock: 52, category: 'Fashion', description: 'Water-resistant 25L backpack with padded 15" laptop sleeve and USB port.' },
  { name: 'Ceramic Mug Set (4)', sku: 'GSH-3001', price: 24000, discount: 0, stock: 70, category: 'Home & Living', description: 'Set of four matte ceramic mugs in muted earth tones, dishwasher safe.' },
  { name: 'Bamboo Cutlery Set', sku: 'GSH-3002', price: 15500, discount: 0, stock: 90, category: 'Home & Living', description: 'Reusable bamboo cutlery set with wooden storage case and cleaning brush.' },
  { name: 'Scented Candle — Amber', sku: 'GSH-3003', price: 19900, discount: 16500, stock: 58, category: 'Home & Living', description: 'Hand-poured amber & sandalwood candle with a 40-hour burn time.' },
  { name: 'The Art of Focus (Hardcover)', sku: 'GSB-4001', price: 28000, discount: 0, stock: 35, category: 'Books & Stationery', description: 'A practical guide to building deep work habits in a distracted world.' }
];

async function run() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });

  const seeded = { categories: 0, products: 0, customers: 0 };

  // Categories
  for (const c of CATEGORIES) {
    const [rows] = await conn.query('SELECT id FROM categories WHERE name = ?', [c.name]);
    if (rows.length === 0) {
      await conn.query('INSERT INTO categories (name, description) VALUES (?, ?)', [c.name, c.description]);
      seeded.categories += 1;
    }
  }

  // Products
  for (const p of PRODUCTS) {
    const [rows] = await conn.query('SELECT p.id FROM products p WHERE p.sku = ?', [p.sku]);
    if (rows.length > 0) continue;
    const [cats] = await conn.query('SELECT id FROM categories WHERE name = ?', [p.category]);
    if (cats.length === 0) {
      console.warn(`[seed] Skipping ${p.name} — category "${p.category}" not found.`);
      continue;
    }
    await conn.query(
      `INSERT INTO products (category_id, name, description, price, discount_price, sku, stock_quantity, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [cats[0].id, p.name, p.description, p.price, p.discount_price || null, p.sku, p.stock, p.image || null]
    );
    seeded.products += 1;
  }

  // Sample customer (dev only, never in production).
  const DEMO_EMAIL = 'demo@godwinshop.com';
  const [demo] = await conn.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);
  if (demo.length === 0) {
    const passwordHash = await bcrypt.hash('Demo12345', 12);
    await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_verified, status, address, city)
       VALUES ('Demo Customer', ?, '+14155550100', ?, 'customer', 1, 'active', '12 Demo Street, Suite 4', 'Demo City')`,
      [DEMO_EMAIL, passwordHash]
    );
    seeded.customers += 1;
  }

  await conn.end();
  console.log(`[seed] Done. Created categories=${seeded.categories} products=${seeded.products} customers=${seeded.customers}`);
  console.log(`[seed] Demo customer: ${DEMO_EMAIL} / Demo12345 (verify seeded: yes)`);
  if (seeded.categories === 0 && seeded.products === 0 && seeded.customers === 0) {
    console.log('[seed] Everything already seeded — nothing to do.');
  }
}
run().catch((err) => {
  console.error('[seed] Failed:', err.message);
  process.exit(1);
});