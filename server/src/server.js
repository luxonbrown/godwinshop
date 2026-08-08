const app = require('./app');
const config = require('./config/env');
const { ping } = require('./config/database');

async function start() {
  try {
    await ping();
    console.log(`[GodwinShop] Database connected at ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (err) {
    console.error('[GodwinShop] FATAL: cannot connect to MySQL.', err.message);
    console.error('  → Make sure MySQL is running and server/.env matches your credentials (see .env.example).');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`[GodwinShop] API listening on http://localhost:${config.port}`);
    console.log(`[GodwinShop] Allowed client origin: ${config.clientUrl}`);
    if (!config.session.secret || config.session.secret === 'replace_with_a_long_random_secret') {
      console.warn('[GodwinShop] WARNING: SESSION_SECRET is unset. Set a strong random secret before going to production.');
    }
    if (config.isProd && !config.session.secure) {
      console.warn('[GodwinShop] WARNING: SESSION_COOKIE_SECURE=false while NODE_ENV=production. Enable it when serving over HTTPS.');
    }
  });

  const shutdown = () => {
    console.log('\n[GodwinShop] Shutting down…');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 3000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();