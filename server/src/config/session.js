const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('./env');

let sessionStore = null;

function getSessionStore() {
  if (!sessionStore) {
    sessionStore = new MySQLStore({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      table: 'sessions',
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      },
      checkExpirationInterval: 900000
    });
  }
  return sessionStore;
}

function sessionMiddleware() {
  return session({
    store: getSessionStore(),
    name: 'godwinshop.sid',
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.isProd && config.session.secure,
      sameSite: config.isProd ? 'lax' : 'lax',
      maxAge: config.session.maxAge
    }
  });
}

module.exports = { sessionMiddleware, getSessionStore };