const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { sessionMiddleware } = require('./config/session');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = String(config.clientUrl)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, origin);
    }
    cb(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (!config.isProd) app.use(morgan('dev'));

app.use(sessionMiddleware());

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'godwinshop-api' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/users', require('./routes/adminUsers.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/stats.routes'));
app.use('/api', require('./routes/contact.routes'));

app.use('/api', notFoundHandler);

app.use(errorHandler);

module.exports = app;