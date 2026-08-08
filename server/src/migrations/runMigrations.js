const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * `npm run setup`
 *
 * 1. Creates the `godwinshop` database (if missing).
 * 2. Applies database/schema.sql (all tables — idempotent CREATE IF NOT EXISTS).
 * 3. Seeds the default admin account (credentials from server/.env, see .env.example).
 */

const SCHEMA_PATH = path.resolve(__dirname, '..', '..', '..', 'database', 'schema.sql');

async function run() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`[setup] Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  console.log(`[setup] Connecting to MySQL at ${config.db.host}:${config.db.port}…`);
  const rootConn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: false
  });

  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await rootConn.end();
  console.log(`[setup] Database "${config.db.database}" ready.`);

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: false
  });

  // Apply schema SQL (multipleStatements=false → split on ";" at line boundaries).
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const statements = sql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await conn.query(statement);
  }
  console.log('[setup] Schema applied (tables: users, verification_tokens, categories, products, orders, order_items, notifications, order_sequences, sessions).');

  // Ensure a "sessions" table exists for the session store.
  await conn.query(
    `CREATE TABLE IF NOT EXISTS sessions (
       session_id  VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
       expires     INT UNSIGNED NOT NULL,
       data        MEDIUMTEXT COLLATE utf8mb4_bin,
       PRIMARY KEY (session_id)
     ) ENGINE=InnoDB`
  );

  // Seed admin.
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [config.admin.email]);
  if (existing.length === 0 && config.admin.password) {
    const passwordHash = await bcrypt.hash(config.admin.password, 12);
    await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_verified, status)
       VALUES (?, ?, ?, ?, 'admin', 1, 'active')`,
      [config.admin.name, config.admin.email, config.admin.phone || null, passwordHash]
    );
    console.log(`[setup] Admin created: ${config.admin.email} / ${config.admin.password}  ← CHANGE THIS IN PRODUCTION`);
  } else {
    console.log(`[setup] Admin account already exists (${config.admin.email}).`);
  }

  await conn.end();
  console.log('[setup] Done. You can now run: npm run seed');
}

run().catch((err) => {
  console.error('[setup] Failed:', err.message);
  process.exit(1);
});