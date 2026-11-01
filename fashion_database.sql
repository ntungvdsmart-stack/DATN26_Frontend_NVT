-- GENERATED: edit backend/sql/schema.source.sql, then run npm run db:generate in backend.
-- Direct SQL import: MySQL 8.0.29+. Backend auto-migration supports earlier MySQL 8.0 via metadata checks.
-- Adds missing structure only. No data reset, sample accounts/passwords, or disabled foreign-key checks.
-- Back up before upgrading. MySQL DDL commits implicitly; rerunning resumes missing objects.
-- For a different database name, change the next two lines. Backend uses DB_NAME from its .env instead.
CREATE DATABASE IF NOT EXISTS fashion_multichannel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fashion_multichannel;
SET NAMES utf8mb4;
DROP PROCEDURE IF EXISTS fashion_apply_schema_v3;
DELIMITER $$
CREATE PROCEDURE fashion_apply_schema_v3()
BEGIN
  DECLARE acquired INT DEFAULT 0;
  DECLARE occupied INT DEFAULT 0;
  DECLARE schema_lock VARCHAR(64);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN DO RELEASE_LOCK(schema_lock); RESIGNAL; END;
  SET schema_lock = CONCAT('fashion_schema_', LEFT(SHA2(DATABASE(), 256), 32));
  SELECT GET_LOCK(schema_lock, 60) INTO acquired;
  IF acquired IS NULL OR acquired <> 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Schema update is busy. Try again later.'; END IF;

  -- 1. All tables first, foreign keys later.
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches') THEN
    CREATE TABLE IF NOT EXISTS `branches` (
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  branch_id       INT AUTO_INCREMENT PRIMARY KEY,
  branch_name     VARCHAR(150) NOT NULL,
  address         VARCHAR(255),
  phone           VARCHAR(20),
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles') THEN
    CREATE TABLE IF NOT EXISTS `roles` (
  role_id         INT AUTO_INCREMENT PRIMARY KEY,
  role_name       VARCHAR(50) NOT NULL UNIQUE COMMENT 'Admin, Staff; khách hàng lưu riêng trong customers'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions') THEN
    CREATE TABLE IF NOT EXISTS `permissions` (
  permission_id   INT AUTO_INCREMENT PRIMARY KEY,
  permission_code VARCHAR(100) NOT NULL UNIQUE,
  description     VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions') THEN
    CREATE TABLE IF NOT EXISTS `role_permissions` (
  role_id         INT NOT NULL,
  permission_id   INT NOT NULL,
  PRIMARY KEY (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts') THEN
    CREATE TABLE IF NOT EXISTS `accounts` (
  auth_version INT NOT NULL DEFAULT 0,
  account_id      INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50) NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE,
  phone           VARCHAR(20),
  role_id         INT NOT NULL,
  branch_id       INT NULL COMMENT 'NULL nếu là Admin không thuộc chi nhánh nào',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs') THEN
    CREATE TABLE IF NOT EXISTS `activity_logs` (
  log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id      INT NULL    COMMENT 'NULL nếu hành động do khách hàng thực hiện',
  customer_id     INT NULL    COMMENT 'NULL nếu hành động do staff/admin thực hiện',
  action          VARCHAR(100) NOT NULL COMMENT 'CREATE_ORDER, UPDATE_PRODUCT, LOGIN...',
  target_table    VARCHAR(100),
  target_id       BIGINT,
  description     VARCHAR(500),
  ip_address      VARCHAR(45),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories') THEN
    CREATE TABLE IF NOT EXISTS `categories` (
  category_id     INT AUTO_INCREMENT PRIMARY KEY,
  category_name   VARCHAR(100) NOT NULL,
  image_url       VARCHAR(1000) NULL,
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  display_order   INT NOT NULL DEFAULT 0,
  parent_id       INT NULL COMMENT 'Danh mục cha, cho phép phân cấp',
  sort_order      INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trong cùng cấp',
  UNIQUE KEY uq_category_per_parent (parent_id, category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands') THEN
    CREATE TABLE IF NOT EXISTS `brands` (
  brand_id        INT AUTO_INCREMENT PRIMARY KEY,
  brand_name      VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes') THEN
    CREATE TABLE IF NOT EXISTS `sizes` (
  size_id         INT AUTO_INCREMENT PRIMARY KEY,
  size_value      VARCHAR(20) NOT NULL UNIQUE COMMENT 'S, M, L, XL, 38, 39...'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors') THEN
    CREATE TABLE IF NOT EXISTS `colors` (
  color_id        INT AUTO_INCREMENT PRIMARY KEY,
  color_name      VARCHAR(50) NOT NULL UNIQUE,
  hex_code        VARCHAR(7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials') THEN
    CREATE TABLE IF NOT EXISTS `materials` (
  material_id     INT AUTO_INCREMENT PRIMARY KEY,
  material_name   VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products') THEN
    CREATE TABLE IF NOT EXISTS `products` (
  size_guide_image_url VARCHAR(500) NULL,
  product_id      INT AUTO_INCREMENT PRIMARY KEY,
  product_name    VARCHAR(200) NOT NULL,
  description     TEXT,
  category_id     INT NOT NULL,
  brand_id        INT NULL,
  base_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT KEY ft_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants') THEN
    CREATE TABLE IF NOT EXISTS `product_variants` (
  size_description TEXT NULL,
  variant_id      INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  sku             VARCHAR(50) NOT NULL UNIQUE,
  size_id         INT NULL,
  color_id        INT NULL,
  material_id     INT NULL,
  price           DECIMAL(12,2) NOT NULL COMMENT 'Có thể khác base_price theo biến thể',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_variant (product_id, size_id, color_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images') THEN
    CREATE TABLE IF NOT EXISTS `product_images` (
  image_id        INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  variant_id      INT NULL COMMENT 'Ảnh riêng theo màu sắc variant (nếu có)',
  image_url       VARCHAR(500) NOT NULL,
  is_primary      TINYINT(1) NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory') THEN
    CREATE TABLE IF NOT EXISTS `inventory` (
  inventory_id    INT AUTO_INCREMENT PRIMARY KEY,
  variant_id      INT NOT NULL,
  branch_id       INT NOT NULL COMMENT 'Kho trung tâm coi như 1 branch đặc biệt',
  quantity        INT NOT NULL DEFAULT 0,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory (variant_id, branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers') THEN
    CREATE TABLE IF NOT EXISTS `customers` (
  auth_version INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  loyalty_points INT NOT NULL DEFAULT 0,
  customer_id     INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  phone           VARCHAR(20) UNIQUE,
  email           VARCHAR(150) UNIQUE,
  password_hash   VARCHAR(255) NULL COMMENT 'NULL nếu là khách vãng lai (guest)',
  customer_type   ENUM('online','guest') NOT NULL DEFAULT 'guest',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses') THEN
    CREATE TABLE IF NOT EXISTS `customer_addresses` (
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  address_id      INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL,
  recipient_name  VARCHAR(150) NOT NULL COMMENT 'Tên người nhận (có thể khác tên KH)',
  recipient_phone VARCHAR(20)  NOT NULL,
  full_address    VARCHAR(255) NOT NULL COMMENT 'Số nhà, tên đường',
  ward            VARCHAR(100),
  district        VARCHAR(100),
  city            VARCHAR(100),
  is_default      TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews') THEN
    CREATE TABLE IF NOT EXISTS `customer_reviews` (
  review_id       INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL,
  variant_id      INT NOT NULL,
  order_id        BIGINT NULL COMMENT 'NULL nếu không xác định được đơn hàng',
  rating          TINYINT NOT NULL COMMENT '1-5',
  comment         TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts') THEN
    CREATE TABLE IF NOT EXISTS `carts` (
  cart_id         INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL UNIQUE COMMENT 'Mỗi khách chỉ có 1 giỏ hàng active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items') THEN
    CREATE TABLE IF NOT EXISTS `cart_items` (
  cart_item_id    INT AUTO_INCREMENT PRIMARY KEY,
  cart_id         INT NOT NULL,
  variant_id      INT NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_variant (cart_id, variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists') THEN
    CREATE TABLE IF NOT EXISTS `wishlists` (
  wishlist_id     INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL,
  variant_id      INT NOT NULL,
  added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (customer_id, variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions') THEN
    CREATE TABLE IF NOT EXISTS `promotions` (
  promotion_id        INT AUTO_INCREMENT PRIMARY KEY,
  promo_code          VARCHAR(50) NOT NULL UNIQUE,
  promo_name          VARCHAR(150) NOT NULL,
  discount_type       ENUM('percent','amount') NOT NULL,
  discount_value      DECIMAL(12,2) NOT NULL,
  channel_scope       ENUM('online','pos','both') NOT NULL DEFAULT 'both',
  min_order_amount    DECIMAL(12,2) NOT NULL DEFAULT 0    COMMENT 'Giá trị đơn hàng tối thiểu để áp dụng',
  max_usage_count     INT NULL                            COMMENT 'NULL = không giới hạn tổng số lần dùng',
  max_per_customer    INT NOT NULL DEFAULT 1              COMMENT 'Mỗi khách dùng tối đa N lần',
  start_date          DATETIME NOT NULL,
  end_date            DATETIME NOT NULL,
  is_active           TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders') THEN
    CREATE TABLE IF NOT EXISTS `orders` (
  loyalty_discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_latitude DECIMAL(10,7) NULL,
  shipping_longitude DECIMAL(10,7) NULL,
  note VARCHAR(500) NULL,
  points_earned INT NOT NULL DEFAULT 0,
  order_id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_code              VARCHAR(30) NOT NULL UNIQUE,
  channel                 ENUM('online','pos') NOT NULL,
  customer_id             INT NULL    COMMENT 'NULL nếu khách vãng lai không lưu tài khoản',
  branch_id               INT NULL    COMMENT 'Bắt buộc nếu channel = pos',
  staff_id                INT NULL    COMMENT 'NV bán tại quầy, NULL nếu đơn online tự đặt',
  order_status            ENUM('pending','confirmed','processing','shipping',
                                 'completed','cancelled','returned') NOT NULL DEFAULT 'pending',
  subtotal_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount            DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_address_id     INT NULL    COMMENT 'FK tới customer_addresses (có thể NULL với POS)',
  shipping_address_snapshot VARCHAR(500) NULL COMMENT 'Snapshot địa chỉ lúc đặt hàng, không thay đổi theo thời gian',
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_channel_status (channel, order_status),
  INDEX idx_orders_customer      (customer_id),
  INDEX idx_orders_created       (created_at),
  INDEX idx_orders_branch        (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items') THEN
    CREATE TABLE IF NOT EXISTS `order_items` (
  order_item_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT NOT NULL,
  variant_id      INT NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(12,2) NOT NULL COMMENT 'Snapshot giá tại thời điểm bán',
  line_discount   DECIMAL(12,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions') THEN
    CREATE TABLE IF NOT EXISTS `order_promotions` (
  order_id         BIGINT NOT NULL,
  promotion_id     INT NOT NULL,
  discount_applied DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (order_id, promotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history') THEN
    CREATE TABLE IF NOT EXISTS `order_status_history` (
  history_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT NOT NULL,
  status      VARCHAR(30) NOT NULL,
  changed_by  INT NULL COMMENT 'account_id thực hiện thay đổi',
  changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note        VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns') THEN
    CREATE TABLE IF NOT EXISTS `order_returns` (
  return_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT NOT NULL,
  return_type   ENUM('return','exchange') NOT NULL,
  reason        VARCHAR(255),
  status        ENUM('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
  processed_by  INT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items') THEN
    CREATE TABLE IF NOT EXISTS `order_return_items` (
  return_item_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  return_id           BIGINT NOT NULL,
  order_item_id       BIGINT NOT NULL,
  quantity            INT NOT NULL,
  exchange_variant_id INT NULL COMMENT 'Biến thể đổi sang (nếu là exchange)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments') THEN
    CREATE TABLE IF NOT EXISTS `payments` (
  payment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id         BIGINT NOT NULL,
  payment_method   ENUM('vnpay','momo','cash','qr_pos','bank_transfer','stripe') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  transaction_code VARCHAR(100) NULL COMMENT 'Mã giao dịch trả về từ cổng thanh toán',
  payment_status   ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at          DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds') THEN
    CREATE TABLE IF NOT EXISTS `payment_refunds` (
  refund_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id   BIGINT NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  reason       VARCHAR(255),
  status       ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending',
  processed_by INT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs') THEN
    CREATE TABLE IF NOT EXISTS `faqs` (
  faq_id      INT AUTO_INCREMENT PRIMARY KEY,
  question    VARCHAR(500) NOT NULL,
  answer      TEXT NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages') THEN
    CREATE TABLE IF NOT EXISTS `ai_chat_messages` (
  message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  sender_type ENUM('customer','bot') NOT NULL,
  message_content TEXT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_chat_customer_message (customer_id, message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations') THEN
    CREATE TABLE IF NOT EXISTS `chat_conversations` (
  conversation_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id       INT NULL,
  staff_id          INT NULL COMMENT 'NULL nếu đang chat với chatbot',
  conversation_type ENUM('bot','human') NOT NULL DEFAULT 'bot',
  started_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at          DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts') THEN
    CREATE TABLE IF NOT EXISTS `chat_read_receipts` (
  conversation_id BIGINT NOT NULL,
  account_id INT NOT NULL,
  last_read_message_id BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages') THEN
    CREATE TABLE IF NOT EXISTS `chat_messages` (
  message_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_type     ENUM('customer','staff','bot') NOT NULL,
  sender_id       INT NULL,
  message_content TEXT NOT NULL,
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications') THEN
    CREATE TABLE IF NOT EXISTS `notifications` (
  notification_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT NULL COMMENT 'Thông báo gửi cho khách hàng',
  account_id       INT NULL COMMENT 'Thông báo gửi cho nhân viên/admin',
  notif_type       VARCHAR(50) NOT NULL COMMENT 'NEW_ORDER, ORDER_STATUS_UPDATE, CHAT_MESSAGE...',
  content          VARCHAR(500) NOT NULL,
  related_order_id BIGINT NULL,
  target_url       VARCHAR(500) NULL,
  related_message_id BIGINT NULL,
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_customer (customer_id, is_read),
  INDEX idx_notif_account  (account_id,  is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings') THEN
    CREATE TABLE IF NOT EXISTS `system_settings` (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations') THEN
    CREATE TABLE IF NOT EXISTS `schema_migrations` (
  migration_key VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps') THEN
    CREATE TABLE IF NOT EXISTS `password_reset_otps` (
  request_id CHAR(64) PRIMARY KEY,
  code_hash VARCHAR(255) NOT NULL,
  verified_at DATETIME NULL,
  reset_token_hash CHAR(64) NULL UNIQUE,
  reset_expires_at DATETIME NULL,
  account_id INT NULL,
  customer_id INT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_expiry (expires_at),
  INDEX idx_otp_account_created (account_id, created_at),
  INDEX idx_otp_customer_created (customer_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens') THEN
    CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  reset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  account_id INT NULL,
  customer_id INT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  END IF;

  -- 2. Missing columns only; refuse unsafe historical backfills.
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'latitude') THEN
    ALTER TABLE `branches` ADD COLUMN latitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'longitude') THEN
    ALTER TABLE `branches` ADD COLUMN longitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'branch_id') THEN
    SELECT EXISTS(SELECT 1 FROM `branches` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: branches.branch_id (mandatory column).'; END IF;
    ALTER TABLE `branches` ADD COLUMN branch_id       INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'branch_name') THEN
    SELECT EXISTS(SELECT 1 FROM `branches` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: branches.branch_name (mandatory column).'; END IF;
    ALTER TABLE `branches` ADD COLUMN branch_name     VARCHAR(150) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'address') THEN
    ALTER TABLE `branches` ADD COLUMN address         VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'phone') THEN
    ALTER TABLE `branches` ADD COLUMN phone           VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `branches` ADD COLUMN is_active       TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `branches` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'role_id') THEN
    SELECT EXISTS(SELECT 1 FROM `roles` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: roles.role_id (mandatory column).'; END IF;
    ALTER TABLE `roles` ADD COLUMN role_id         INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'role_name') THEN
    SELECT EXISTS(SELECT 1 FROM `roles` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: roles.role_name (mandatory column).'; END IF;
    ALTER TABLE `roles` ADD COLUMN role_name       VARCHAR(50) NOT NULL UNIQUE COMMENT 'Admin, Staff; khách hàng lưu riêng trong customers';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' AND COLUMN_NAME = 'permission_id') THEN
    SELECT EXISTS(SELECT 1 FROM `permissions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: permissions.permission_id (mandatory column).'; END IF;
    ALTER TABLE `permissions` ADD COLUMN permission_id   INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' AND COLUMN_NAME = 'permission_code') THEN
    SELECT EXISTS(SELECT 1 FROM `permissions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: permissions.permission_code (mandatory column).'; END IF;
    ALTER TABLE `permissions` ADD COLUMN permission_code VARCHAR(100) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' AND COLUMN_NAME = 'description') THEN
    ALTER TABLE `permissions` ADD COLUMN description     VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' AND COLUMN_NAME = 'role_id') THEN
    SELECT EXISTS(SELECT 1 FROM `role_permissions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: role_permissions.role_id (mandatory column).'; END IF;
    ALTER TABLE `role_permissions` ADD COLUMN role_id         INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' AND COLUMN_NAME = 'permission_id') THEN
    SELECT EXISTS(SELECT 1 FROM `role_permissions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: role_permissions.permission_id (mandatory column).'; END IF;
    ALTER TABLE `role_permissions` ADD COLUMN permission_id   INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'auth_version') THEN
    ALTER TABLE `accounts` ADD COLUMN auth_version INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'account_id') THEN
    SELECT EXISTS(SELECT 1 FROM `accounts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: accounts.account_id (mandatory column).'; END IF;
    ALTER TABLE `accounts` ADD COLUMN account_id      INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'username') THEN
    ALTER TABLE `accounts` ADD COLUMN username        VARCHAR(50) NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'password_hash') THEN
    SELECT EXISTS(SELECT 1 FROM `accounts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: accounts.password_hash (mandatory column).'; END IF;
    ALTER TABLE `accounts` ADD COLUMN password_hash   VARCHAR(255) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'full_name') THEN
    SELECT EXISTS(SELECT 1 FROM `accounts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: accounts.full_name (mandatory column).'; END IF;
    ALTER TABLE `accounts` ADD COLUMN full_name       VARCHAR(150) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'email') THEN
    ALTER TABLE `accounts` ADD COLUMN email           VARCHAR(150) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'phone') THEN
    ALTER TABLE `accounts` ADD COLUMN phone           VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'role_id') THEN
    SELECT EXISTS(SELECT 1 FROM `accounts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: accounts.role_id (mandatory column).'; END IF;
    ALTER TABLE `accounts` ADD COLUMN role_id         INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'branch_id') THEN
    ALTER TABLE `accounts` ADD COLUMN branch_id       INT NULL COMMENT 'NULL nếu là Admin không thuộc chi nhánh nào';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `accounts` ADD COLUMN is_active       TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `accounts` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'log_id') THEN
    SELECT EXISTS(SELECT 1 FROM `activity_logs` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: activity_logs.log_id (mandatory column).'; END IF;
    ALTER TABLE `activity_logs` ADD COLUMN log_id          BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'account_id') THEN
    ALTER TABLE `activity_logs` ADD COLUMN account_id      INT NULL    COMMENT 'NULL nếu hành động do khách hàng thực hiện';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `activity_logs` ADD COLUMN customer_id     INT NULL    COMMENT 'NULL nếu hành động do staff/admin thực hiện';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'action') THEN
    SELECT EXISTS(SELECT 1 FROM `activity_logs` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: activity_logs.action (mandatory column).'; END IF;
    ALTER TABLE `activity_logs` ADD COLUMN action          VARCHAR(100) NOT NULL COMMENT 'CREATE_ORDER, UPDATE_PRODUCT, LOGIN...';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'target_table') THEN
    ALTER TABLE `activity_logs` ADD COLUMN target_table    VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'target_id') THEN
    ALTER TABLE `activity_logs` ADD COLUMN target_id       BIGINT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'description') THEN
    ALTER TABLE `activity_logs` ADD COLUMN description     VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'ip_address') THEN
    ALTER TABLE `activity_logs` ADD COLUMN ip_address      VARCHAR(45);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `activity_logs` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'category_id') THEN
    SELECT EXISTS(SELECT 1 FROM `categories` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: categories.category_id (mandatory column).'; END IF;
    ALTER TABLE `categories` ADD COLUMN category_id     INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'category_name') THEN
    SELECT EXISTS(SELECT 1 FROM `categories` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: categories.category_name (mandatory column).'; END IF;
    ALTER TABLE `categories` ADD COLUMN category_name   VARCHAR(100) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image_url') THEN
    ALTER TABLE `categories` ADD COLUMN image_url       VARCHAR(1000) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_featured') THEN
    ALTER TABLE `categories` ADD COLUMN is_featured     TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'display_order') THEN
    ALTER TABLE `categories` ADD COLUMN display_order   INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'parent_id') THEN
    ALTER TABLE `categories` ADD COLUMN parent_id       INT NULL COMMENT 'Danh mục cha, cho phép phân cấp';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'sort_order') THEN
    ALTER TABLE `categories` ADD COLUMN sort_order      INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trong cùng cấp';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands' AND COLUMN_NAME = 'brand_id') THEN
    SELECT EXISTS(SELECT 1 FROM `brands` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: brands.brand_id (mandatory column).'; END IF;
    ALTER TABLE `brands` ADD COLUMN brand_id        INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands' AND COLUMN_NAME = 'brand_name') THEN
    SELECT EXISTS(SELECT 1 FROM `brands` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: brands.brand_name (mandatory column).'; END IF;
    ALTER TABLE `brands` ADD COLUMN brand_name      VARCHAR(100) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes' AND COLUMN_NAME = 'size_id') THEN
    SELECT EXISTS(SELECT 1 FROM `sizes` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: sizes.size_id (mandatory column).'; END IF;
    ALTER TABLE `sizes` ADD COLUMN size_id         INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes' AND COLUMN_NAME = 'size_value') THEN
    SELECT EXISTS(SELECT 1 FROM `sizes` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: sizes.size_value (mandatory column).'; END IF;
    ALTER TABLE `sizes` ADD COLUMN size_value      VARCHAR(20) NOT NULL UNIQUE COMMENT 'S, M, L, XL, 38, 39...';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors' AND COLUMN_NAME = 'color_id') THEN
    SELECT EXISTS(SELECT 1 FROM `colors` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: colors.color_id (mandatory column).'; END IF;
    ALTER TABLE `colors` ADD COLUMN color_id        INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors' AND COLUMN_NAME = 'color_name') THEN
    SELECT EXISTS(SELECT 1 FROM `colors` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: colors.color_name (mandatory column).'; END IF;
    ALTER TABLE `colors` ADD COLUMN color_name      VARCHAR(50) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors' AND COLUMN_NAME = 'hex_code') THEN
    ALTER TABLE `colors` ADD COLUMN hex_code        VARCHAR(7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'material_id') THEN
    SELECT EXISTS(SELECT 1 FROM `materials` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: materials.material_id (mandatory column).'; END IF;
    ALTER TABLE `materials` ADD COLUMN material_id     INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' AND COLUMN_NAME = 'material_name') THEN
    SELECT EXISTS(SELECT 1 FROM `materials` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: materials.material_name (mandatory column).'; END IF;
    ALTER TABLE `materials` ADD COLUMN material_name   VARCHAR(100) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'size_guide_image_url') THEN
    ALTER TABLE `products` ADD COLUMN size_guide_image_url VARCHAR(500) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'product_id') THEN
    SELECT EXISTS(SELECT 1 FROM `products` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: products.product_id (mandatory column).'; END IF;
    ALTER TABLE `products` ADD COLUMN product_id      INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'product_name') THEN
    SELECT EXISTS(SELECT 1 FROM `products` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: products.product_name (mandatory column).'; END IF;
    ALTER TABLE `products` ADD COLUMN product_name    VARCHAR(200) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'description') THEN
    ALTER TABLE `products` ADD COLUMN description     TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id') THEN
    SELECT EXISTS(SELECT 1 FROM `products` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: products.category_id (mandatory column).'; END IF;
    ALTER TABLE `products` ADD COLUMN category_id     INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'brand_id') THEN
    ALTER TABLE `products` ADD COLUMN brand_id        INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'base_price') THEN
    ALTER TABLE `products` ADD COLUMN base_price      DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `products` ADD COLUMN is_active       TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `products` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `products` ADD COLUMN updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'size_description') THEN
    ALTER TABLE `product_variants` ADD COLUMN size_description TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `product_variants` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_variants.variant_id (mandatory column).'; END IF;
    ALTER TABLE `product_variants` ADD COLUMN variant_id      INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'product_id') THEN
    SELECT EXISTS(SELECT 1 FROM `product_variants` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_variants.product_id (mandatory column).'; END IF;
    ALTER TABLE `product_variants` ADD COLUMN product_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'sku') THEN
    SELECT EXISTS(SELECT 1 FROM `product_variants` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_variants.sku (mandatory column).'; END IF;
    ALTER TABLE `product_variants` ADD COLUMN sku             VARCHAR(50) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'size_id') THEN
    ALTER TABLE `product_variants` ADD COLUMN size_id         INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'color_id') THEN
    ALTER TABLE `product_variants` ADD COLUMN color_id        INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'material_id') THEN
    ALTER TABLE `product_variants` ADD COLUMN material_id     INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'price') THEN
    SELECT EXISTS(SELECT 1 FROM `product_variants` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_variants.price (mandatory column).'; END IF;
    ALTER TABLE `product_variants` ADD COLUMN price           DECIMAL(12,2) NOT NULL COMMENT 'Có thể khác base_price theo biến thể';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `product_variants` ADD COLUMN is_active       TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'image_id') THEN
    SELECT EXISTS(SELECT 1 FROM `product_images` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_images.image_id (mandatory column).'; END IF;
    ALTER TABLE `product_images` ADD COLUMN image_id        INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'product_id') THEN
    SELECT EXISTS(SELECT 1 FROM `product_images` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_images.product_id (mandatory column).'; END IF;
    ALTER TABLE `product_images` ADD COLUMN product_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'variant_id') THEN
    ALTER TABLE `product_images` ADD COLUMN variant_id      INT NULL COMMENT 'Ảnh riêng theo màu sắc variant (nếu có)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'image_url') THEN
    SELECT EXISTS(SELECT 1 FROM `product_images` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: product_images.image_url (mandatory column).'; END IF;
    ALTER TABLE `product_images` ADD COLUMN image_url       VARCHAR(500) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'is_primary') THEN
    ALTER TABLE `product_images` ADD COLUMN is_primary      TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'sort_order') THEN
    ALTER TABLE `product_images` ADD COLUMN sort_order      INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'inventory_id') THEN
    SELECT EXISTS(SELECT 1 FROM `inventory` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: inventory.inventory_id (mandatory column).'; END IF;
    ALTER TABLE `inventory` ADD COLUMN inventory_id    INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `inventory` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: inventory.variant_id (mandatory column).'; END IF;
    ALTER TABLE `inventory` ADD COLUMN variant_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'branch_id') THEN
    SELECT EXISTS(SELECT 1 FROM `inventory` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: inventory.branch_id (mandatory column).'; END IF;
    ALTER TABLE `inventory` ADD COLUMN branch_id       INT NOT NULL COMMENT 'Kho trung tâm coi như 1 branch đặc biệt';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'quantity') THEN
    ALTER TABLE `inventory` ADD COLUMN quantity        INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `inventory` ADD COLUMN updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'auth_version') THEN
    ALTER TABLE `customers` ADD COLUMN auth_version INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `customers` ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'loyalty_points') THEN
    ALTER TABLE `customers` ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customers` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customers.customer_id (mandatory column).'; END IF;
    ALTER TABLE `customers` ADD COLUMN customer_id     INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'full_name') THEN
    SELECT EXISTS(SELECT 1 FROM `customers` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customers.full_name (mandatory column).'; END IF;
    ALTER TABLE `customers` ADD COLUMN full_name       VARCHAR(150) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'phone') THEN
    ALTER TABLE `customers` ADD COLUMN phone           VARCHAR(20) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'email') THEN
    ALTER TABLE `customers` ADD COLUMN email           VARCHAR(150) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'password_hash') THEN
    ALTER TABLE `customers` ADD COLUMN password_hash   VARCHAR(255) NULL COMMENT 'NULL nếu là khách vãng lai (guest)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_type') THEN
    ALTER TABLE `customers` ADD COLUMN customer_type   ENUM('online','guest') NOT NULL DEFAULT 'guest';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `customers` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'latitude') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN latitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'longitude') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN longitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'address_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_addresses` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_addresses.address_id (mandatory column).'; END IF;
    ALTER TABLE `customer_addresses` ADD COLUMN address_id      INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_addresses` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_addresses.customer_id (mandatory column).'; END IF;
    ALTER TABLE `customer_addresses` ADD COLUMN customer_id     INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'recipient_name') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_addresses` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_addresses.recipient_name (mandatory column).'; END IF;
    ALTER TABLE `customer_addresses` ADD COLUMN recipient_name  VARCHAR(150) NOT NULL COMMENT 'Tên người nhận (có thể khác tên KH)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'recipient_phone') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_addresses` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_addresses.recipient_phone (mandatory column).'; END IF;
    ALTER TABLE `customer_addresses` ADD COLUMN recipient_phone VARCHAR(20)  NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'full_address') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_addresses` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_addresses.full_address (mandatory column).'; END IF;
    ALTER TABLE `customer_addresses` ADD COLUMN full_address    VARCHAR(255) NOT NULL COMMENT 'Số nhà, tên đường';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'ward') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN ward            VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'district') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN district        VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'city') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN city            VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'is_default') THEN
    ALTER TABLE `customer_addresses` ADD COLUMN is_default      TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'review_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_reviews` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_reviews.review_id (mandatory column).'; END IF;
    ALTER TABLE `customer_reviews` ADD COLUMN review_id       INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_reviews` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_reviews.customer_id (mandatory column).'; END IF;
    ALTER TABLE `customer_reviews` ADD COLUMN customer_id     INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_reviews` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_reviews.variant_id (mandatory column).'; END IF;
    ALTER TABLE `customer_reviews` ADD COLUMN variant_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'order_id') THEN
    ALTER TABLE `customer_reviews` ADD COLUMN order_id        BIGINT NULL COMMENT 'NULL nếu không xác định được đơn hàng';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'rating') THEN
    SELECT EXISTS(SELECT 1 FROM `customer_reviews` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: customer_reviews.rating (mandatory column).'; END IF;
    ALTER TABLE `customer_reviews` ADD COLUMN rating          TINYINT NOT NULL COMMENT '1-5';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'comment') THEN
    ALTER TABLE `customer_reviews` ADD COLUMN comment         TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `customer_reviews` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'cart_id') THEN
    SELECT EXISTS(SELECT 1 FROM `carts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: carts.cart_id (mandatory column).'; END IF;
    ALTER TABLE `carts` ADD COLUMN cart_id         INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `carts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: carts.customer_id (mandatory column).'; END IF;
    ALTER TABLE `carts` ADD COLUMN customer_id     INT NOT NULL UNIQUE COMMENT 'Mỗi khách chỉ có 1 giỏ hàng active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `carts` ADD COLUMN created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'cart_item_id') THEN
    SELECT EXISTS(SELECT 1 FROM `cart_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: cart_items.cart_item_id (mandatory column).'; END IF;
    ALTER TABLE `cart_items` ADD COLUMN cart_item_id    INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'cart_id') THEN
    SELECT EXISTS(SELECT 1 FROM `cart_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: cart_items.cart_id (mandatory column).'; END IF;
    ALTER TABLE `cart_items` ADD COLUMN cart_id         INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `cart_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: cart_items.variant_id (mandatory column).'; END IF;
    ALTER TABLE `cart_items` ADD COLUMN variant_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'quantity') THEN
    ALTER TABLE `cart_items` ADD COLUMN quantity        INT NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'added_at') THEN
    ALTER TABLE `cart_items` ADD COLUMN added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND COLUMN_NAME = 'wishlist_id') THEN
    SELECT EXISTS(SELECT 1 FROM `wishlists` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: wishlists.wishlist_id (mandatory column).'; END IF;
    ALTER TABLE `wishlists` ADD COLUMN wishlist_id     INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `wishlists` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: wishlists.customer_id (mandatory column).'; END IF;
    ALTER TABLE `wishlists` ADD COLUMN customer_id     INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `wishlists` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: wishlists.variant_id (mandatory column).'; END IF;
    ALTER TABLE `wishlists` ADD COLUMN variant_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND COLUMN_NAME = 'added_at') THEN
    ALTER TABLE `wishlists` ADD COLUMN added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'promotion_id') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.promotion_id (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN promotion_id        INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'promo_code') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.promo_code (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN promo_code          VARCHAR(50) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'promo_name') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.promo_name (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN promo_name          VARCHAR(150) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'discount_type') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.discount_type (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN discount_type       ENUM('percent','amount') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'discount_value') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.discount_value (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN discount_value      DECIMAL(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'channel_scope') THEN
    ALTER TABLE `promotions` ADD COLUMN channel_scope       ENUM('online','pos','both') NOT NULL DEFAULT 'both';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'min_order_amount') THEN
    ALTER TABLE `promotions` ADD COLUMN min_order_amount    DECIMAL(12,2) NOT NULL DEFAULT 0    COMMENT 'Giá trị đơn hàng tối thiểu để áp dụng';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'max_usage_count') THEN
    ALTER TABLE `promotions` ADD COLUMN max_usage_count     INT NULL                            COMMENT 'NULL = không giới hạn tổng số lần dùng';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'max_per_customer') THEN
    ALTER TABLE `promotions` ADD COLUMN max_per_customer    INT NOT NULL DEFAULT 1              COMMENT 'Mỗi khách dùng tối đa N lần';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'start_date') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.start_date (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN start_date          DATETIME NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'end_date') THEN
    SELECT EXISTS(SELECT 1 FROM `promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: promotions.end_date (mandatory column).'; END IF;
    ALTER TABLE `promotions` ADD COLUMN end_date            DATETIME NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `promotions` ADD COLUMN is_active           TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'loyalty_discount') THEN
    ALTER TABLE `orders` ADD COLUMN loyalty_discount DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_fee') THEN
    ALTER TABLE `orders` ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_latitude') THEN
    ALTER TABLE `orders` ADD COLUMN shipping_latitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_longitude') THEN
    ALTER TABLE `orders` ADD COLUMN shipping_longitude DECIMAL(10,7) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'note') THEN
    ALTER TABLE `orders` ADD COLUMN note VARCHAR(500) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'points_earned') THEN
    ALTER TABLE `orders` ADD COLUMN points_earned INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `orders` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: orders.order_id (mandatory column).'; END IF;
    ALTER TABLE `orders` ADD COLUMN order_id                BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_code') THEN
    SELECT EXISTS(SELECT 1 FROM `orders` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: orders.order_code (mandatory column).'; END IF;
    ALTER TABLE `orders` ADD COLUMN order_code              VARCHAR(30) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'channel') THEN
    SELECT EXISTS(SELECT 1 FROM `orders` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: orders.channel (mandatory column).'; END IF;
    ALTER TABLE `orders` ADD COLUMN channel                 ENUM('online','pos') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `orders` ADD COLUMN customer_id             INT NULL    COMMENT 'NULL nếu khách vãng lai không lưu tài khoản';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'branch_id') THEN
    ALTER TABLE `orders` ADD COLUMN branch_id               INT NULL    COMMENT 'Bắt buộc nếu channel = pos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'staff_id') THEN
    ALTER TABLE `orders` ADD COLUMN staff_id                INT NULL    COMMENT 'NV bán tại quầy, NULL nếu đơn online tự đặt';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_status') THEN
    ALTER TABLE `orders` ADD COLUMN order_status            ENUM('pending','confirmed','processing','shipping',
                                 'completed','cancelled','returned') NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'subtotal_amount') THEN
    ALTER TABLE `orders` ADD COLUMN subtotal_amount         DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_amount') THEN
    ALTER TABLE `orders` ADD COLUMN discount_amount         DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'total_amount') THEN
    ALTER TABLE `orders` ADD COLUMN total_amount            DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_address_id') THEN
    ALTER TABLE `orders` ADD COLUMN shipping_address_id     INT NULL    COMMENT 'FK tới customer_addresses (có thể NULL với POS)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_address_snapshot') THEN
    ALTER TABLE `orders` ADD COLUMN shipping_address_snapshot VARCHAR(500) NULL COMMENT 'Snapshot địa chỉ lúc đặt hàng, không thay đổi theo thời gian';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `orders` ADD COLUMN created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `orders` ADD COLUMN updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'order_item_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_items.order_item_id (mandatory column).'; END IF;
    ALTER TABLE `order_items` ADD COLUMN order_item_id   BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_items.order_id (mandatory column).'; END IF;
    ALTER TABLE `order_items` ADD COLUMN order_id        BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variant_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_items.variant_id (mandatory column).'; END IF;
    ALTER TABLE `order_items` ADD COLUMN variant_id      INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'quantity') THEN
    SELECT EXISTS(SELECT 1 FROM `order_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_items.quantity (mandatory column).'; END IF;
    ALTER TABLE `order_items` ADD COLUMN quantity        INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'unit_price') THEN
    SELECT EXISTS(SELECT 1 FROM `order_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_items.unit_price (mandatory column).'; END IF;
    ALTER TABLE `order_items` ADD COLUMN unit_price      DECIMAL(12,2) NOT NULL COMMENT 'Snapshot giá tại thời điểm bán';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'line_discount') THEN
    ALTER TABLE `order_items` ADD COLUMN line_discount   DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_promotions.order_id (mandatory column).'; END IF;
    ALTER TABLE `order_promotions` ADD COLUMN order_id         BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' AND COLUMN_NAME = 'promotion_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_promotions.promotion_id (mandatory column).'; END IF;
    ALTER TABLE `order_promotions` ADD COLUMN promotion_id     INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' AND COLUMN_NAME = 'discount_applied') THEN
    SELECT EXISTS(SELECT 1 FROM `order_promotions` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_promotions.discount_applied (mandatory column).'; END IF;
    ALTER TABLE `order_promotions` ADD COLUMN discount_applied DECIMAL(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'history_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_status_history` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_status_history.history_id (mandatory column).'; END IF;
    ALTER TABLE `order_status_history` ADD COLUMN history_id  BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_status_history` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_status_history.order_id (mandatory column).'; END IF;
    ALTER TABLE `order_status_history` ADD COLUMN order_id    BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'status') THEN
    SELECT EXISTS(SELECT 1 FROM `order_status_history` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_status_history.status (mandatory column).'; END IF;
    ALTER TABLE `order_status_history` ADD COLUMN status      VARCHAR(30) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'changed_by') THEN
    ALTER TABLE `order_status_history` ADD COLUMN changed_by  INT NULL COMMENT 'account_id thực hiện thay đổi';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'changed_at') THEN
    ALTER TABLE `order_status_history` ADD COLUMN changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'note') THEN
    ALTER TABLE `order_status_history` ADD COLUMN note        VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'return_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_returns` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_returns.return_id (mandatory column).'; END IF;
    ALTER TABLE `order_returns` ADD COLUMN return_id     BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_returns` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_returns.order_id (mandatory column).'; END IF;
    ALTER TABLE `order_returns` ADD COLUMN order_id      BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'return_type') THEN
    SELECT EXISTS(SELECT 1 FROM `order_returns` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_returns.return_type (mandatory column).'; END IF;
    ALTER TABLE `order_returns` ADD COLUMN return_type   ENUM('return','exchange') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'reason') THEN
    ALTER TABLE `order_returns` ADD COLUMN reason        VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'status') THEN
    ALTER TABLE `order_returns` ADD COLUMN status        ENUM('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'processed_by') THEN
    ALTER TABLE `order_returns` ADD COLUMN processed_by  INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `order_returns` ADD COLUMN created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND COLUMN_NAME = 'return_item_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_return_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_return_items.return_item_id (mandatory column).'; END IF;
    ALTER TABLE `order_return_items` ADD COLUMN return_item_id      BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND COLUMN_NAME = 'return_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_return_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_return_items.return_id (mandatory column).'; END IF;
    ALTER TABLE `order_return_items` ADD COLUMN return_id           BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND COLUMN_NAME = 'order_item_id') THEN
    SELECT EXISTS(SELECT 1 FROM `order_return_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_return_items.order_item_id (mandatory column).'; END IF;
    ALTER TABLE `order_return_items` ADD COLUMN order_item_id       BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND COLUMN_NAME = 'quantity') THEN
    SELECT EXISTS(SELECT 1 FROM `order_return_items` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: order_return_items.quantity (mandatory column).'; END IF;
    ALTER TABLE `order_return_items` ADD COLUMN quantity            INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND COLUMN_NAME = 'exchange_variant_id') THEN
    ALTER TABLE `order_return_items` ADD COLUMN exchange_variant_id INT NULL COMMENT 'Biến thể đổi sang (nếu là exchange)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_id') THEN
    SELECT EXISTS(SELECT 1 FROM `payments` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payments.payment_id (mandatory column).'; END IF;
    ALTER TABLE `payments` ADD COLUMN payment_id       BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'order_id') THEN
    SELECT EXISTS(SELECT 1 FROM `payments` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payments.order_id (mandatory column).'; END IF;
    ALTER TABLE `payments` ADD COLUMN order_id         BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_method') THEN
    SELECT EXISTS(SELECT 1 FROM `payments` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payments.payment_method (mandatory column).'; END IF;
    ALTER TABLE `payments` ADD COLUMN payment_method   ENUM('vnpay','momo','cash','qr_pos','bank_transfer','stripe') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'amount') THEN
    SELECT EXISTS(SELECT 1 FROM `payments` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payments.amount (mandatory column).'; END IF;
    ALTER TABLE `payments` ADD COLUMN amount           DECIMAL(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'transaction_code') THEN
    ALTER TABLE `payments` ADD COLUMN transaction_code VARCHAR(100) NULL COMMENT 'Mã giao dịch trả về từ cổng thanh toán';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_status') THEN
    ALTER TABLE `payments` ADD COLUMN payment_status   ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'paid_at') THEN
    ALTER TABLE `payments` ADD COLUMN paid_at          DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `payments` ADD COLUMN created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'refund_id') THEN
    SELECT EXISTS(SELECT 1 FROM `payment_refunds` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payment_refunds.refund_id (mandatory column).'; END IF;
    ALTER TABLE `payment_refunds` ADD COLUMN refund_id    BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'payment_id') THEN
    SELECT EXISTS(SELECT 1 FROM `payment_refunds` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payment_refunds.payment_id (mandatory column).'; END IF;
    ALTER TABLE `payment_refunds` ADD COLUMN payment_id   BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'amount') THEN
    SELECT EXISTS(SELECT 1 FROM `payment_refunds` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: payment_refunds.amount (mandatory column).'; END IF;
    ALTER TABLE `payment_refunds` ADD COLUMN amount       DECIMAL(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'reason') THEN
    ALTER TABLE `payment_refunds` ADD COLUMN reason       VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'status') THEN
    ALTER TABLE `payment_refunds` ADD COLUMN status       ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'processed_by') THEN
    ALTER TABLE `payment_refunds` ADD COLUMN processed_by INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `payment_refunds` ADD COLUMN created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'faq_id') THEN
    SELECT EXISTS(SELECT 1 FROM `faqs` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: faqs.faq_id (mandatory column).'; END IF;
    ALTER TABLE `faqs` ADD COLUMN faq_id      INT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'question') THEN
    SELECT EXISTS(SELECT 1 FROM `faqs` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: faqs.question (mandatory column).'; END IF;
    ALTER TABLE `faqs` ADD COLUMN question    VARCHAR(500) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'answer') THEN
    SELECT EXISTS(SELECT 1 FROM `faqs` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: faqs.answer (mandatory column).'; END IF;
    ALTER TABLE `faqs` ADD COLUMN answer      TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'is_active') THEN
    ALTER TABLE `faqs` ADD COLUMN is_active   TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND COLUMN_NAME = 'message_id') THEN
    SELECT EXISTS(SELECT 1 FROM `ai_chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: ai_chat_messages.message_id (mandatory column).'; END IF;
    ALTER TABLE `ai_chat_messages` ADD COLUMN message_id BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND COLUMN_NAME = 'customer_id') THEN
    SELECT EXISTS(SELECT 1 FROM `ai_chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: ai_chat_messages.customer_id (mandatory column).'; END IF;
    ALTER TABLE `ai_chat_messages` ADD COLUMN customer_id INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND COLUMN_NAME = 'sender_type') THEN
    SELECT EXISTS(SELECT 1 FROM `ai_chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: ai_chat_messages.sender_type (mandatory column).'; END IF;
    ALTER TABLE `ai_chat_messages` ADD COLUMN sender_type ENUM('customer','bot') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND COLUMN_NAME = 'message_content') THEN
    SELECT EXISTS(SELECT 1 FROM `ai_chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: ai_chat_messages.message_content (mandatory column).'; END IF;
    ALTER TABLE `ai_chat_messages` ADD COLUMN message_content TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND COLUMN_NAME = 'sent_at') THEN
    ALTER TABLE `ai_chat_messages` ADD COLUMN sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'conversation_id') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_conversations` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_conversations.conversation_id (mandatory column).'; END IF;
    ALTER TABLE `chat_conversations` ADD COLUMN conversation_id   BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `chat_conversations` ADD COLUMN customer_id       INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'staff_id') THEN
    ALTER TABLE `chat_conversations` ADD COLUMN staff_id          INT NULL COMMENT 'NULL nếu đang chat với chatbot';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'conversation_type') THEN
    ALTER TABLE `chat_conversations` ADD COLUMN conversation_type ENUM('bot','human') NOT NULL DEFAULT 'bot';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'started_at') THEN
    ALTER TABLE `chat_conversations` ADD COLUMN started_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND COLUMN_NAME = 'ended_at') THEN
    ALTER TABLE `chat_conversations` ADD COLUMN ended_at          DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND COLUMN_NAME = 'conversation_id') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_read_receipts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_read_receipts.conversation_id (mandatory column).'; END IF;
    ALTER TABLE `chat_read_receipts` ADD COLUMN conversation_id BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND COLUMN_NAME = 'account_id') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_read_receipts` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_read_receipts.account_id (mandatory column).'; END IF;
    ALTER TABLE `chat_read_receipts` ADD COLUMN account_id INT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND COLUMN_NAME = 'last_read_message_id') THEN
    ALTER TABLE `chat_read_receipts` ADD COLUMN last_read_message_id BIGINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `chat_read_receipts` ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'message_id') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_messages.message_id (mandatory column).'; END IF;
    ALTER TABLE `chat_messages` ADD COLUMN message_id      BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'conversation_id') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_messages.conversation_id (mandatory column).'; END IF;
    ALTER TABLE `chat_messages` ADD COLUMN conversation_id BIGINT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'sender_type') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_messages.sender_type (mandatory column).'; END IF;
    ALTER TABLE `chat_messages` ADD COLUMN sender_type     ENUM('customer','staff','bot') NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'sender_id') THEN
    ALTER TABLE `chat_messages` ADD COLUMN sender_id       INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'message_content') THEN
    SELECT EXISTS(SELECT 1 FROM `chat_messages` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: chat_messages.message_content (mandatory column).'; END IF;
    ALTER TABLE `chat_messages` ADD COLUMN message_content TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'sent_at') THEN
    ALTER TABLE `chat_messages` ADD COLUMN sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'notification_id') THEN
    SELECT EXISTS(SELECT 1 FROM `notifications` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: notifications.notification_id (mandatory column).'; END IF;
    ALTER TABLE `notifications` ADD COLUMN notification_id  BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `notifications` ADD COLUMN customer_id      INT NULL COMMENT 'Thông báo gửi cho khách hàng';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'account_id') THEN
    ALTER TABLE `notifications` ADD COLUMN account_id       INT NULL COMMENT 'Thông báo gửi cho nhân viên/admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'notif_type') THEN
    SELECT EXISTS(SELECT 1 FROM `notifications` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: notifications.notif_type (mandatory column).'; END IF;
    ALTER TABLE `notifications` ADD COLUMN notif_type       VARCHAR(50) NOT NULL COMMENT 'NEW_ORDER, ORDER_STATUS_UPDATE, CHAT_MESSAGE...';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'content') THEN
    SELECT EXISTS(SELECT 1 FROM `notifications` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: notifications.content (mandatory column).'; END IF;
    ALTER TABLE `notifications` ADD COLUMN content          VARCHAR(500) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'related_order_id') THEN
    ALTER TABLE `notifications` ADD COLUMN related_order_id BIGINT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'target_url') THEN
    ALTER TABLE `notifications` ADD COLUMN target_url       VARCHAR(500) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'related_message_id') THEN
    ALTER TABLE `notifications` ADD COLUMN related_message_id BIGINT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read') THEN
    ALTER TABLE `notifications` ADD COLUMN is_read          TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `notifications` ADD COLUMN created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'setting_key') THEN
    SELECT EXISTS(SELECT 1 FROM `system_settings` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: system_settings.setting_key (mandatory column).'; END IF;
    ALTER TABLE `system_settings` ADD COLUMN setting_key VARCHAR(100) PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'setting_value') THEN
    ALTER TABLE `system_settings` ADD COLUMN setting_value TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `system_settings` ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `system_settings` ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations' AND COLUMN_NAME = 'migration_key') THEN
    SELECT EXISTS(SELECT 1 FROM `schema_migrations` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: schema_migrations.migration_key (mandatory column).'; END IF;
    ALTER TABLE `schema_migrations` ADD COLUMN migration_key VARCHAR(100) PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations' AND COLUMN_NAME = 'applied_at') THEN
    ALTER TABLE `schema_migrations` ADD COLUMN applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'request_id') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_otps` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_otps.request_id (mandatory column).'; END IF;
    ALTER TABLE `password_reset_otps` ADD COLUMN request_id CHAR(64) PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'code_hash') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_otps` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_otps.code_hash (mandatory column).'; END IF;
    ALTER TABLE `password_reset_otps` ADD COLUMN code_hash VARCHAR(255) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'verified_at') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN verified_at DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'reset_token_hash') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN reset_token_hash CHAR(64) NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'reset_expires_at') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN reset_expires_at DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'account_id') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN account_id INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN customer_id INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'attempts') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN attempts TINYINT UNSIGNED NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'expires_at') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_otps` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_otps.expires_at (mandatory column).'; END IF;
    ALTER TABLE `password_reset_otps` ADD COLUMN expires_at DATETIME NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'used_at') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN used_at DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `password_reset_otps` ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'reset_id') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_tokens` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_tokens.reset_id (mandatory column).'; END IF;
    ALTER TABLE `password_reset_tokens` ADD COLUMN reset_id BIGINT AUTO_INCREMENT PRIMARY KEY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'token_hash') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_tokens` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_tokens.token_hash (mandatory column).'; END IF;
    ALTER TABLE `password_reset_tokens` ADD COLUMN token_hash CHAR(64) NOT NULL UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'account_id') THEN
    ALTER TABLE `password_reset_tokens` ADD COLUMN account_id INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'customer_id') THEN
    ALTER TABLE `password_reset_tokens` ADD COLUMN customer_id INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'expires_at') THEN
    SELECT EXISTS(SELECT 1 FROM `password_reset_tokens` LIMIT 1) INTO occupied;
    IF occupied = 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill required: password_reset_tokens.expires_at (mandatory column).'; END IF;
    ALTER TABLE `password_reset_tokens` ADD COLUMN expires_at DATETIME NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'used_at') THEN
    ALTER TABLE `password_reset_tokens` ADD COLUMN used_at DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `password_reset_tokens` ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  INSERT INTO roles (role_id, role_name) SELECT 1, 'Admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_id = 1 OR role_name = 'Admin');
  INSERT INTO roles (role_id, role_name) SELECT 2, 'Staff' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_id = 2 OR role_name = 'Staff');

  -- 3. Recognize equivalent indexes/FKs even under different names.
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'branch_id') THEN
    ALTER TABLE `branches` ADD PRIMARY KEY (`branch_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'role_id') THEN
    ALTER TABLE `roles` ADD PRIMARY KEY (`role_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'role_name') THEN
    ALTER TABLE `roles` ADD UNIQUE KEY `role_name` (`role_name`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'permission_id') THEN
    ALTER TABLE `permissions` ADD PRIMARY KEY (`permission_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'permission_code') THEN
    ALTER TABLE `permissions` ADD UNIQUE KEY `permission_code` (`permission_code`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'role_id,permission_id') THEN
    ALTER TABLE `role_permissions` ADD PRIMARY KEY (role_id, permission_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' AND REFERENCED_TABLE_NAME = 'roles' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'role_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'role_id') THEN
    ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' AND REFERENCED_TABLE_NAME = 'permissions' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'permission_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'permission_id') THEN
    ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `accounts` ADD PRIMARY KEY (`account_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'username') THEN
    ALTER TABLE `accounts` ADD UNIQUE KEY `username` (`username`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'email') THEN
    ALTER TABLE `accounts` ADD UNIQUE KEY `email` (`email`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND REFERENCED_TABLE_NAME = 'roles' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'role_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'role_id') THEN
    ALTER TABLE `accounts` ADD CONSTRAINT `fk_accounts_role_id` FOREIGN KEY (role_id) REFERENCES roles(role_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND REFERENCED_TABLE_NAME = 'branches' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id') THEN
    ALTER TABLE `accounts` ADD CONSTRAINT `fk_accounts_branch_id` FOREIGN KEY (branch_id) REFERENCES branches(branch_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'log_id') THEN
    ALTER TABLE `activity_logs` ADD PRIMARY KEY (`log_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `activity_logs` ADD CONSTRAINT `fk_activity_logs_account_id` FOREIGN KEY (account_id)  REFERENCES accounts(account_id)  ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `activity_logs` ADD CONSTRAINT `fk_activity_logs_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'category_id') THEN
    ALTER TABLE `categories` ADD PRIMARY KEY (`category_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'parent_id,category_name') THEN
    ALTER TABLE `categories` ADD UNIQUE KEY uq_category_per_parent (parent_id, category_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND REFERENCED_TABLE_NAME = 'categories' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'parent_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'category_id') THEN
    ALTER TABLE `categories` ADD CONSTRAINT `fk_categories_parent_id` FOREIGN KEY (parent_id) REFERENCES categories(category_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'brand_id') THEN
    ALTER TABLE `brands` ADD PRIMARY KEY (`brand_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'brand_name') THEN
    ALTER TABLE `brands` ADD UNIQUE KEY `brand_name` (`brand_name`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'size_id') THEN
    ALTER TABLE `sizes` ADD PRIMARY KEY (`size_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sizes' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'size_value') THEN
    ALTER TABLE `sizes` ADD UNIQUE KEY `size_value` (`size_value`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'color_id') THEN
    ALTER TABLE `colors` ADD PRIMARY KEY (`color_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'colors' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'color_name') THEN
    ALTER TABLE `colors` ADD UNIQUE KEY `color_name` (`color_name`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'material_id') THEN
    ALTER TABLE `materials` ADD PRIMARY KEY (`material_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'material_name') THEN
    ALTER TABLE `materials` ADD UNIQUE KEY `material_name` (`material_name`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'product_id') THEN
    ALTER TABLE `products` ADD PRIMARY KEY (`product_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'FULLTEXT' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'product_name') THEN
    ALTER TABLE `products` ADD FULLTEXT KEY ft_product_name (product_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND REFERENCED_TABLE_NAME = 'categories' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'category_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'category_id') THEN
    ALTER TABLE `products` ADD CONSTRAINT `fk_products_category_id` FOREIGN KEY (category_id) REFERENCES categories(category_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND REFERENCED_TABLE_NAME = 'brands' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'brand_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'brand_id') THEN
    ALTER TABLE `products` ADD CONSTRAINT `fk_products_brand_id` FOREIGN KEY (brand_id) REFERENCES brands(brand_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `product_variants` ADD PRIMARY KEY (`variant_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'sku') THEN
    ALTER TABLE `product_variants` ADD UNIQUE KEY `sku` (`sku`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'product_id,size_id,color_id,material_id') THEN
    ALTER TABLE `product_variants` ADD UNIQUE KEY uq_variant (product_id, size_id, color_id, material_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND REFERENCED_TABLE_NAME = 'products' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'product_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'product_id') THEN
    ALTER TABLE `product_variants` ADD CONSTRAINT `fk_product_variants_product_id` FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND REFERENCED_TABLE_NAME = 'sizes' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'size_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'size_id') THEN
    ALTER TABLE `product_variants` ADD CONSTRAINT `fk_product_variants_size_id` FOREIGN KEY (size_id)    REFERENCES sizes(size_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND REFERENCED_TABLE_NAME = 'colors' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'color_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'color_id') THEN
    ALTER TABLE `product_variants` ADD CONSTRAINT `fk_product_variants_color_id` FOREIGN KEY (color_id)   REFERENCES colors(color_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND REFERENCED_TABLE_NAME = 'materials' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'material_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'material_id') THEN
    ALTER TABLE `product_variants` ADD CONSTRAINT `fk_product_variants_material_id` FOREIGN KEY (material_id) REFERENCES materials(material_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'image_id') THEN
    ALTER TABLE `product_images` ADD PRIMARY KEY (`image_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND REFERENCED_TABLE_NAME = 'products' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'product_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'product_id') THEN
    ALTER TABLE `product_images` ADD CONSTRAINT `fk_product_images_product_id` FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `product_images` ADD CONSTRAINT `fk_product_images_variant_id` FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'inventory_id') THEN
    ALTER TABLE `inventory` ADD PRIMARY KEY (`inventory_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'variant_id,branch_id') THEN
    ALTER TABLE `inventory` ADD UNIQUE KEY uq_inventory (variant_id, branch_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `inventory` ADD CONSTRAINT `fk_inventory_variant_id` FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND REFERENCED_TABLE_NAME = 'branches' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id') THEN
    ALTER TABLE `inventory` ADD CONSTRAINT `fk_inventory_branch_id` FOREIGN KEY (branch_id) REFERENCES branches(branch_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `customers` ADD PRIMARY KEY (`customer_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'phone') THEN
    ALTER TABLE `customers` ADD UNIQUE KEY `phone` (`phone`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'email') THEN
    ALTER TABLE `customers` ADD UNIQUE KEY `email` (`email`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'phone') THEN
    ALTER TABLE `customers` ADD INDEX `idx_customers_phone` (`phone`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'address_id') THEN
    ALTER TABLE `customer_addresses` ADD PRIMARY KEY (`address_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_addresses' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `customer_addresses` ADD CONSTRAINT `fk_customer_addresses_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'review_id') THEN
    ALTER TABLE `customer_reviews` ADD PRIMARY KEY (`review_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `customer_reviews` ADD CONSTRAINT `fk_customer_reviews_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `customer_reviews` ADD CONSTRAINT `fk_customer_reviews_variant_id` FOREIGN KEY (variant_id)  REFERENCES product_variants(variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_reviews' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `customer_reviews` ADD CONSTRAINT `fk_customer_reviews_order_id` FOREIGN KEY (order_id)    REFERENCES orders(order_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.CHECK_CONSTRAINTS cc JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'customer_reviews' AND tc.CONSTRAINT_TYPE = 'CHECK' AND REGEXP_REPLACE(LOWER(cc.CHECK_CLAUSE), '[[:space:]`()]+', '') = 'ratingbetween1and5') THEN
    ALTER TABLE `customer_reviews` ADD CONSTRAINT `chk_customer_reviews_1` CHECK (rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'cart_id') THEN
    ALTER TABLE `carts` ADD PRIMARY KEY (`cart_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `carts` ADD UNIQUE KEY `customer_id` (`customer_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `carts` ADD CONSTRAINT `fk_carts_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'cart_item_id') THEN
    ALTER TABLE `cart_items` ADD PRIMARY KEY (`cart_item_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'cart_id,variant_id') THEN
    ALTER TABLE `cart_items` ADD UNIQUE KEY uq_cart_variant (cart_id, variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND REFERENCED_TABLE_NAME = 'carts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'cart_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'cart_id') THEN
    ALTER TABLE `cart_items` ADD CONSTRAINT `fk_cart_items_cart_id` FOREIGN KEY (cart_id)    REFERENCES carts(cart_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `cart_items` ADD CONSTRAINT `fk_cart_items_variant_id` FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'wishlist_id') THEN
    ALTER TABLE `wishlists` ADD PRIMARY KEY (`wishlist_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id,variant_id') THEN
    ALTER TABLE `wishlists` ADD UNIQUE KEY uq_wishlist (customer_id, variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `wishlists` ADD CONSTRAINT `fk_wishlists_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlists' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `wishlists` ADD CONSTRAINT `fk_wishlists_variant_id` FOREIGN KEY (variant_id)  REFERENCES product_variants(variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'promotion_id') THEN
    ALTER TABLE `promotions` ADD PRIMARY KEY (`promotion_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'promo_code') THEN
    ALTER TABLE `promotions` ADD UNIQUE KEY `promo_code` (`promo_code`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.CHECK_CONSTRAINTS cc JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'promotions' AND tc.CONSTRAINT_TYPE = 'CHECK' AND REGEXP_REPLACE(LOWER(cc.CHECK_CLAUSE), '[[:space:]`()]+', '') = 'end_date>start_date') THEN
    ALTER TABLE `promotions` ADD CONSTRAINT `chk_promotions_1` CHECK (end_date > start_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `orders` ADD PRIMARY KEY (`order_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'order_code') THEN
    ALTER TABLE `orders` ADD UNIQUE KEY `order_code` (`order_code`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'channel,order_status') THEN
    ALTER TABLE `orders` ADD INDEX idx_order_channel_status (channel, order_status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `orders` ADD INDEX idx_orders_customer      (customer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'created_at') THEN
    ALTER TABLE `orders` ADD INDEX idx_orders_created       (created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'branch_id') THEN
    ALTER TABLE `orders` ADD INDEX idx_orders_branch        (branch_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'staff_id,created_at') THEN
    ALTER TABLE `orders` ADD INDEX `idx_orders_staff_created` (`staff_id`, `created_at`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_customer_id` FOREIGN KEY (customer_id)          REFERENCES customers(customer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND REFERENCED_TABLE_NAME = 'branches' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'branch_id') THEN
    ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_branch_id` FOREIGN KEY (branch_id)            REFERENCES branches(branch_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'staff_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_staff_id` FOREIGN KEY (staff_id)             REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND REFERENCED_TABLE_NAME = 'customer_addresses' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'shipping_address_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'address_id') THEN
    ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_shipping_address_id` FOREIGN KEY (shipping_address_id)  REFERENCES customer_addresses(address_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'order_item_id') THEN
    ALTER TABLE `order_items` ADD PRIMARY KEY (`order_item_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_variant_id` FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'order_id,promotion_id') THEN
    ALTER TABLE `order_promotions` ADD PRIMARY KEY (order_id, promotion_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `order_promotions` ADD CONSTRAINT `fk_order_promotions_order_id` FOREIGN KEY (order_id)     REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_promotions' AND REFERENCED_TABLE_NAME = 'promotions' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'promotion_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'promotion_id') THEN
    ALTER TABLE `order_promotions` ADD CONSTRAINT `fk_order_promotions_promotion_id` FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'history_id') THEN
    ALTER TABLE `order_status_history` ADD PRIMARY KEY (`history_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `order_status_history` ADD CONSTRAINT `fk_order_status_history_order_id` FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'changed_by' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `order_status_history` ADD CONSTRAINT `fk_order_status_history_changed_by` FOREIGN KEY (changed_by) REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'return_id') THEN
    ALTER TABLE `order_returns` ADD PRIMARY KEY (`return_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `order_returns` ADD CONSTRAINT `fk_order_returns_order_id` FOREIGN KEY (order_id)      REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_returns' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'processed_by' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `order_returns` ADD CONSTRAINT `fk_order_returns_processed_by` FOREIGN KEY (processed_by)  REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'return_item_id') THEN
    ALTER TABLE `order_return_items` ADD PRIMARY KEY (`return_item_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND REFERENCED_TABLE_NAME = 'order_returns' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'return_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'return_id') THEN
    ALTER TABLE `order_return_items` ADD CONSTRAINT `fk_order_return_items_return_id` FOREIGN KEY (return_id)            REFERENCES order_returns(return_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND REFERENCED_TABLE_NAME = 'order_items' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_item_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_item_id') THEN
    ALTER TABLE `order_return_items` ADD CONSTRAINT `fk_order_return_items_order_item_id` FOREIGN KEY (order_item_id)        REFERENCES order_items(order_item_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_return_items' AND REFERENCED_TABLE_NAME = 'product_variants' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'exchange_variant_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'variant_id') THEN
    ALTER TABLE `order_return_items` ADD CONSTRAINT `fk_order_return_items_exchange_variant_id` FOREIGN KEY (exchange_variant_id)  REFERENCES product_variants(variant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'payment_id') THEN
    ALTER TABLE `payments` ADD PRIMARY KEY (`payment_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_order_id` FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'refund_id') THEN
    ALTER TABLE `payment_refunds` ADD PRIMARY KEY (`refund_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND REFERENCED_TABLE_NAME = 'payments' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'payment_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'payment_id') THEN
    ALTER TABLE `payment_refunds` ADD CONSTRAINT `fk_payment_refunds_payment_id` FOREIGN KEY (payment_id)   REFERENCES payments(payment_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_refunds' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'processed_by' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `payment_refunds` ADD CONSTRAINT `fk_payment_refunds_processed_by` FOREIGN KEY (processed_by) REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'faq_id') THEN
    ALTER TABLE `faqs` ADD PRIMARY KEY (`faq_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'message_id') THEN
    ALTER TABLE `ai_chat_messages` ADD PRIMARY KEY (`message_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id,message_id') THEN
    ALTER TABLE `ai_chat_messages` ADD INDEX idx_ai_chat_customer_message (customer_id, message_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_chat_messages' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `ai_chat_messages` ADD CONSTRAINT `fk_ai_chat_messages_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'conversation_id') THEN
    ALTER TABLE `chat_conversations` ADD PRIMARY KEY (`conversation_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `chat_conversations` ADD CONSTRAINT `fk_chat_conversations_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'staff_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `chat_conversations` ADD CONSTRAINT `fk_chat_conversations_staff_id` FOREIGN KEY (staff_id)    REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'conversation_id,account_id') THEN
    ALTER TABLE `chat_read_receipts` ADD PRIMARY KEY (conversation_id, account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND REFERENCED_TABLE_NAME = 'chat_conversations' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'conversation_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'conversation_id') THEN
    ALTER TABLE `chat_read_receipts` ADD CONSTRAINT `fk_chat_read_receipts_conversation_id` FOREIGN KEY (conversation_id) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_read_receipts' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `chat_read_receipts` ADD CONSTRAINT `fk_chat_read_receipts_account_id` FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'message_id') THEN
    ALTER TABLE `chat_messages` ADD PRIMARY KEY (`message_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND REFERENCED_TABLE_NAME = 'chat_conversations' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'conversation_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'conversation_id') THEN
    ALTER TABLE `chat_messages` ADD CONSTRAINT `fk_chat_messages_conversation_id` FOREIGN KEY (conversation_id) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'notification_id') THEN
    ALTER TABLE `notifications` ADD PRIMARY KEY (`notification_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id,is_read') THEN
    ALTER TABLE `notifications` ADD INDEX idx_notif_customer (customer_id, is_read);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'account_id,is_read') THEN
    ALTER TABLE `notifications` ADD INDEX idx_notif_account  (account_id,  is_read);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_customer_id` FOREIGN KEY (customer_id)      REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_account_id` FOREIGN KEY (account_id)       REFERENCES accounts(account_id)   ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND REFERENCED_TABLE_NAME = 'orders' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'related_order_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'order_id') THEN
    ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_related_order_id` FOREIGN KEY (related_order_id) REFERENCES orders(order_id)        ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'setting_key') THEN
    ALTER TABLE `system_settings` ADD PRIMARY KEY (`setting_key`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'migration_key') THEN
    ALTER TABLE `schema_migrations` ADD PRIMARY KEY (`migration_key`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'request_id') THEN
    ALTER TABLE `password_reset_otps` ADD PRIMARY KEY (`request_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'reset_token_hash') THEN
    ALTER TABLE `password_reset_otps` ADD UNIQUE KEY `reset_token_hash` (`reset_token_hash`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'expires_at') THEN
    ALTER TABLE `password_reset_otps` ADD INDEX idx_otp_expiry (expires_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'account_id,created_at') THEN
    ALTER TABLE `password_reset_otps` ADD INDEX idx_otp_account_created (account_id, created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'customer_id,created_at') THEN
    ALTER TABLE `password_reset_otps` ADD INDEX idx_otp_customer_created (customer_id, created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `password_reset_otps` ADD CONSTRAINT `fk_password_reset_otps_account_id` FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `password_reset_otps` ADD CONSTRAINT `fk_password_reset_otps_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'reset_id') THEN
    ALTER TABLE `password_reset_tokens` ADD PRIMARY KEY (`reset_id`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 0 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'token_hash') THEN
    ALTER TABLE `password_reset_tokens` ADD UNIQUE KEY `token_hash` (`token_hash`);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE HAVING INDEX_TYPE = 'BTREE' AND NON_UNIQUE = 1 AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'expires_at') THEN
    ALTER TABLE `password_reset_tokens` ADD INDEX idx_reset_expiry (expires_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND REFERENCED_TABLE_NAME = 'accounts' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'account_id') THEN
    ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `fk_password_reset_tokens_account_id` FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND REFERENCED_TABLE_NAME = 'customers' GROUP BY CONSTRAINT_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id' AND GROUP_CONCAT(REFERENCED_COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',') = 'customer_id') THEN
    ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `fk_password_reset_tokens_customer_id` FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_revenue_by_channel') THEN
    SET @fashion_view_ddl = 'CREATE VIEW vw_revenue_by_channel AS
SELECT
    o.channel,
    DATE(o.created_at)          AS sale_date,
    COUNT(DISTINCT o.order_id)  AS total_orders,
    SUM(o.total_amount)         AS total_revenue
FROM orders o
WHERE o.order_status = ''completed''
GROUP BY o.channel, DATE(o.created_at)';
    PREPARE fashion_view_stmt FROM @fashion_view_ddl;
    EXECUTE fashion_view_stmt;
    DEALLOCATE PREPARE fashion_view_stmt;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_best_selling_products') THEN
    SET @fashion_view_ddl = 'CREATE VIEW vw_best_selling_products AS
SELECT
    o.channel,
    p.product_id,
    p.product_name,
    SUM(oi.quantity)                                        AS total_sold,
    SUM(oi.quantity * oi.unit_price - oi.line_discount)    AS total_revenue
FROM order_items oi
JOIN orders o             ON oi.order_id  = o.order_id
JOIN product_variants pv  ON oi.variant_id = pv.variant_id
JOIN products p           ON pv.product_id = p.product_id
WHERE o.order_status = ''completed''
GROUP BY o.channel, p.product_id, p.product_name';
    PREPARE fashion_view_stmt FROM @fashion_view_ddl;
    EXECUTE fashion_view_stmt;
    DEALLOCATE PREPARE fashion_view_stmt;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_inventory_summary') THEN
    SET @fashion_view_ddl = 'CREATE VIEW vw_inventory_summary AS
SELECT
    p.product_id,
    p.product_name,
    b.branch_id,
    b.branch_name,
    SUM(i.quantity) AS total_stock
FROM inventory i
JOIN product_variants pv  ON i.variant_id  = pv.variant_id
JOIN products p           ON pv.product_id = p.product_id
JOIN branches b           ON i.branch_id   = b.branch_id
GROUP BY p.product_id, p.product_name, b.branch_id, b.branch_name';
    PREPARE fashion_view_stmt FROM @fashion_view_ddl;
    EXECUTE fashion_view_stmt;
    DEALLOCATE PREPARE fashion_view_stmt;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_customer_stats') THEN
    SET @fashion_view_ddl = 'CREATE VIEW vw_customer_stats AS
SELECT
    c.customer_id,
    c.full_name,
    COUNT(o.order_id)                   AS total_orders,
    COALESCE(SUM(o.total_amount), 0)    AS total_spent,
    MAX(o.created_at)                   AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status = ''completed''
GROUP BY c.customer_id, c.full_name';
    PREPARE fashion_view_stmt FROM @fashion_view_ddl;
    EXECUTE fashion_view_stmt;
    DEALLOCATE PREPARE fashion_view_stmt;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_promotion_stats') THEN
    SET @fashion_view_ddl = 'CREATE VIEW vw_promotion_stats AS
SELECT
    pr.promotion_id,
    pr.promo_code,
    pr.promo_name,
    COUNT(DISTINCT op.order_id)     AS times_used,
    SUM(op.discount_applied)        AS total_discount_given,
    pr.max_usage_count
FROM promotions pr
LEFT JOIN order_promotions op ON pr.promotion_id = op.promotion_id
GROUP BY pr.promotion_id, pr.promo_code, pr.promo_name, pr.max_usage_count';
    PREPARE fashion_view_stmt FROM @fashion_view_ddl;
    EXECUTE fashion_view_stmt;
    DEALLOCATE PREPARE fashion_view_stmt;
  END IF;
  INSERT INTO permissions (permission_code, description) SELECT 'products.read', 'Xem sản phẩm' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'products.read');
  INSERT INTO permissions (permission_code, description) SELECT 'products.manage', 'Thêm, sửa và ngừng bán sản phẩm' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'products.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'catalog.manage', 'Quản lý danh mục, thương hiệu và thuộc tính' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'catalog.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'inventory.read', 'Xem tồn kho' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'inventory.read');
  INSERT INTO permissions (permission_code, description) SELECT 'inventory.manage', 'Điều chỉnh tồn kho chi nhánh' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'inventory.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'pos.sell', 'Bán hàng tại quầy' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'pos.sell');
  INSERT INTO permissions (permission_code, description) SELECT 'orders.read', 'Xem đơn hàng' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'orders.read');
  INSERT INTO permissions (permission_code, description) SELECT 'orders.manage', 'Xử lý đơn hàng' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'orders.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'customers.read', 'Xem khách hàng' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'customers.read');
  INSERT INTO permissions (permission_code, description) SELECT 'customers.manage', 'Quản lý khách hàng' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'customers.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'promotions.read', 'Xem khuyến mãi' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'promotions.read');
  INSERT INTO permissions (permission_code, description) SELECT 'promotions.manage', 'Quản lý khuyến mãi' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'promotions.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'returns.manage', 'Xử lý đổi trả' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'returns.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'support.manage', 'Hỗ trợ khách hàng' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'support.manage');
  INSERT INTO permissions (permission_code, description) SELECT 'stats.read', 'Xem thống kê' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'stats.read');
  INSERT INTO permissions (permission_code, description) SELECT 'branches.read', 'Xem danh sách chi nhánh' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'branches.read');
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE migration_key = 'role-permissions-v1') THEN
    INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT r.role_id, p.permission_id FROM roles r CROSS JOIN permissions p WHERE r.role_name = 'Staff' AND p.permission_code IN ('products.read','inventory.read','inventory.manage','pos.sell','orders.read','orders.manage','customers.read','customers.manage','promotions.read','returns.manage','support.manage','stats.read','branches.read');
    INSERT INTO schema_migrations (migration_key) VALUES ('role-permissions-v1');
  END IF;
END$$
DELIMITER ;
CALL fashion_apply_schema_v3();
DROP PROCEDURE fashion_apply_schema_v3;

-- 4. Preserve existing triggers. Conditional CREATE requires MySQL 8.0.29+.
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_activity_logs_before_insert
BEFORE INSERT ON activity_logs
FOR EACH ROW
BEGIN
    IF NEW.account_id IS NULL AND NEW.customer_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'activity_logs: account_id và customer_id không thể đồng thời NULL';
    END IF;
END$$
CREATE TRIGGER IF NOT EXISTS trg_activity_logs_before_update
BEFORE UPDATE ON activity_logs
FOR EACH ROW
BEGIN
    IF NEW.account_id IS NULL AND NEW.customer_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'activity_logs: account_id và customer_id không thể đồng thời NULL';
    END IF;
END$$
CREATE TRIGGER IF NOT EXISTS trg_variants_before_insert
BEFORE INSERT ON product_variants
FOR EACH ROW
BEGIN
    DECLARE dup_count INT DEFAULT 0;
    SELECT COUNT(*) INTO dup_count
    FROM product_variants
    WHERE product_id  = NEW.product_id
      AND COALESCE(size_id,     0) = COALESCE(NEW.size_id,     0)
      AND COALESCE(color_id,    0) = COALESCE(NEW.color_id,    0)
      AND COALESCE(material_id, 0) = COALESCE(NEW.material_id, 0);

    IF dup_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'product_variants: Đã tồn tại biến thể với tổ hợp size/màu/chất liệu này';
    END IF;
END$$
CREATE TRIGGER IF NOT EXISTS trg_variants_before_update
BEFORE UPDATE ON product_variants
FOR EACH ROW
BEGIN
    DECLARE dup_count INT DEFAULT 0;
    SELECT COUNT(*) INTO dup_count
    FROM product_variants
    WHERE product_id  = NEW.product_id
      AND COALESCE(size_id,     0) = COALESCE(NEW.size_id,     0)
      AND COALESCE(color_id,    0) = COALESCE(NEW.color_id,    0)
      AND COALESCE(material_id, 0) = COALESCE(NEW.material_id, 0)
      AND variant_id != NEW.variant_id;

    IF dup_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'product_variants: Đã tồn tại biến thể với tổ hợp size/màu/chất liệu này';
    END IF;
END$$
CREATE TRIGGER IF NOT EXISTS trg_notifications_before_insert
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    IF NOT (
        (NEW.customer_id IS NOT NULL AND NEW.account_id IS NULL) OR
        (NEW.customer_id IS NULL     AND NEW.account_id IS NOT NULL)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'notifications: Phải có đúng 1 recipient (customer_id hoặc account_id)';
    END IF;
END$$
CREATE TRIGGER IF NOT EXISTS trg_notifications_before_update
BEFORE UPDATE ON notifications
FOR EACH ROW
BEGIN
    IF NOT (
        (NEW.customer_id IS NOT NULL AND NEW.account_id IS NULL) OR
        (NEW.customer_id IS NULL     AND NEW.account_id IS NOT NULL)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'notifications: Phải có đúng 1 recipient (customer_id hoặc account_id)';
    END IF;
END$$
DELIMITER ;
DO RELEASE_LOCK(CONCAT('fashion_schema_', LEFT(SHA2(DATABASE(), 256), 32)));
SELECT 'Schema synchronized. Start backend for versioned data migrations.' AS migration_status;
