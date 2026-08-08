const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const serverEnvPath = path.resolve(__dirname, '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

const isProd = process.env.NODE_ENV === 'production';

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  isProd,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'godwinshop',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev_insecure_secret_change_me',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
    secure: process.env.SESSION_COOKIE_SECURE === 'true'
  },
  admin: {
    name: process.env.ADMIN_USERNAME || 'Godwin Admin',
    email: process.env.ADMIN_EMAIL || 'admin@godwinshop.com',
    phone: process.env.ADMIN_PHONE || '07550000000',
    password: process.env.ADMIN_PASSWORD || 'GodwinAdmin123'
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'GodwinShop <no-reply@godwinshop.com>'
  },
  delivery: {
    fee: parseFloat(process.env.DELIVERY_FEE || '2500'),
    freeThreshold: parseFloat(process.env.FREE_DELIVERY_THRESHOLD || '50000')
  },
  uploads: {
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '5', 10)
  }
};

module.exports = config;