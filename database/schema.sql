-- ============================================================================
-- GodwinShop — MySQL database schema
-- Run this file with: mysql -u root -p < database/schema.sql
-- or automatically via: npm run setup  (server/migrations/runMigrations.js)
-- ============================================================================



-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  phone         VARCHAR(30)   DEFAULT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  profile_image VARCHAR(500)  DEFAULT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  address       VARCHAR(500)  DEFAULT NULL,
  city          VARCHAR(120)  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- verification_tokens — one-time tokens used to verify accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64)  NOT NULL,
  purpose    ENUM('verify_account','reset_password') NOT NULL DEFAULT 'verify_account',
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_verification_token_hash (token_hash),
  KEY idx_verification_user (user_id),
  CONSTRAINT fk_verification_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id    INT UNSIGNED NOT NULL,
  name           VARCHAR(200)  NOT NULL,
  description    TEXT,
  price          DECIMAL(12,2) NOT NULL,
  discount_price DECIMAL(12,2) DEFAULT NULL,
  sku            VARCHAR(64)   NOT NULL,
  stock_quantity INT UNSIGNED  NOT NULL DEFAULT 0,
  image_url      VARCHAR(500)  DEFAULT NULL,
  status         ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category_id),
  KEY idx_products_status (status),
  KEY idx_products_price (price),
  KEY idx_products_name (name),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number           VARCHAR(40) NOT NULL,
  user_id                INT UNSIGNED NOT NULL,
  subtotal               DECIMAL(12,2) NOT NULL,
  delivery_fee           DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount           DECIMAL(12,2) NOT NULL,
  delivery_address       VARCHAR(500) NOT NULL,
  delivery_city          VARCHAR(120) DEFAULT NULL,
  delivery_phone         VARCHAR(40)  NOT NULL,
  delivery_instructions  TEXT,
  status                 ENUM('pending','confirmed','processing','ready_for_delivery','out_for_delivery','delivered','cancelled')
                         NOT NULL DEFAULT 'pending',
  expected_delivery_date DATE DEFAULT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  KEY idx_orders_delivery_date (expected_delivery_date),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- order_items — unit_price is snapshotted at purchase time
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal   DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  title            VARCHAR(190) NOT NULL,
  message          VARCHAR(500) NOT NULL,
  type             ENUM('order','system','product','account') NOT NULL DEFAULT 'system',
  related_order_id INT UNSIGNED DEFAULT NULL,
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_user_read (user_id, is_read),
  KEY idx_notifications_order (related_order_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notifications_order
    FOREIGN KEY (related_order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- order_sequences — used to generate unique order numbers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_sequences (
  seq_date DATE NOT NULL PRIMARY KEY,
  seq_value INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- contact_messages — support messages sent via the Contact page
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(120) DEFAULT NULL,
  message    TEXT NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_contact_messages_read (is_read)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- sessions — persistent, MySQL-backed session storage (express-mysql-session)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id  VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires     INT UNSIGNED NOT NULL,
  data        MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB;