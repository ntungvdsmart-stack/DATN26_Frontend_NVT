-- ============================================================================
-- CƠ SỞ DỮ LIỆU: HỆ THỐNG BÁN HÀNG THỜI TRANG ĐA KÊNH (Online + POS)
-- Chuẩn hóa tới 3NF (Third Normal Form)
-- MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fashion_multichannel
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fashion_multichannel;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- MODULE 8: QUẢN TRỊ HỆ THỐNG (Branches, Accounts, Roles, Logs)
-- Đặt trước vì nhiều bảng khác tham chiếu tới branch_id / account_id
-- ============================================================================

CREATE TABLE branches (
    branch_id       INT AUTO_INCREMENT PRIMARY KEY,
    branch_name     VARCHAR(150) NOT NULL,
    address         VARCHAR(255),
    phone           VARCHAR(20),
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles (
    role_id         INT AUTO_INCREMENT PRIMARY KEY,
    role_name       VARCHAR(50) NOT NULL UNIQUE COMMENT 'Admin, NV_Online, NV_POS, NV_Kho...'
) ENGINE=InnoDB;

CREATE TABLE permissions (
    permission_id   INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255)
) ENGINE=InnoDB;

-- Quan hệ N-N giữa role và permission (đã chuẩn hóa, tránh lặp permission trong role)
CREATE TABLE role_permissions (
    role_id         INT NOT NULL,
    permission_id   INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE accounts (
    account_id      INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE,
    phone           VARCHAR(20),
    role_id         INT NOT NULL,
    branch_id       INT NULL COMMENT 'NULL nếu là Admin không thuộc chi nhánh nào',
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id      INT NOT NULL,
    action           VARCHAR(100) NOT NULL COMMENT 'CREATE_ORDER, UPDATE_PRODUCT, LOGIN...',
    target_table    VARCHAR(100),
    target_id       BIGINT,
    description     VARCHAR(500),
    ip_address      VARCHAR(45),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 1: QUẢN LÝ SẢN PHẨM
-- Tồn kho theo biến thể (size + màu + chất liệu) dùng chung Online & POS
-- ============================================================================

CREATE TABLE categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    category_name   VARCHAR(100) NOT NULL,
    parent_id       INT NULL COMMENT 'Danh mục cha, cho phép phân cấp',
    FOREIGN KEY (parent_id) REFERENCES categories(category_id)
) ENGINE=InnoDB;

CREATE TABLE brands (
    brand_id        INT AUTO_INCREMENT PRIMARY KEY,
    brand_name      VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE sizes (
    size_id         INT AUTO_INCREMENT PRIMARY KEY,
    size_value      VARCHAR(20) NOT NULL UNIQUE COMMENT 'S, M, L, XL, 38, 39...'
) ENGINE=InnoDB;

CREATE TABLE colors (
    color_id        INT AUTO_INCREMENT PRIMARY KEY,
    color_name      VARCHAR(50) NOT NULL UNIQUE,
    hex_code        VARCHAR(7)
) ENGINE=InnoDB;

CREATE TABLE materials (
    material_id     INT AUTO_INCREMENT PRIMARY KEY,
    material_name   VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE products (
    product_id      INT AUTO_INCREMENT PRIMARY KEY,
    product_name    VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     INT NOT NULL,
    brand_id        INT NULL,
    base_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FULLTEXT KEY ft_product_name (product_name)
) ENGINE=InnoDB;

-- Biến thể sản phẩm: mỗi tổ hợp size/màu/chất liệu là 1 SKU riêng, có giá & tồn kho riêng
CREATE TABLE product_variants (
    variant_id      INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    sku             VARCHAR(50) NOT NULL UNIQUE,
    size_id         INT NULL,
    color_id        INT NULL,
    material_id     INT NULL,
    price           DECIMAL(12,2) NOT NULL COMMENT 'Có thể khác base_price theo biến thể',
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(size_id),
    FOREIGN KEY (color_id) REFERENCES colors(color_id),
    FOREIGN KEY (material_id) REFERENCES materials(material_id),
    UNIQUE KEY uq_variant (product_id, size_id, color_id, material_id)
) ENGINE=InnoDB;

CREATE TABLE product_images (
    image_id        INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    variant_id      INT NULL COMMENT 'Ảnh riêng theo màu (nếu có)',
    image_url       VARCHAR(500) NOT NULL,
    is_primary      TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tồn kho theo biến thể VÀ theo chi nhánh (dùng chung cho Online & POS)
CREATE TABLE inventory (
    inventory_id    INT AUTO_INCREMENT PRIMARY KEY,
    variant_id      INT NOT NULL,
    branch_id       INT NOT NULL COMMENT 'Kho trung tâm coi như 1 branch đặc biệt',
    quantity        INT NOT NULL DEFAULT 0,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    UNIQUE KEY uq_inventory (variant_id, branch_id)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 7: QUẢN LÝ KHÁCH HÀNG (đăng ký online + khách vãng lai tại quầy)
-- ============================================================================

CREATE TABLE customers (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) UNIQUE,
    email           VARCHAR(150) UNIQUE,
    password_hash   VARCHAR(255) NULL COMMENT 'NULL nếu là khách vãng lai (guest)',
    customer_type   ENUM('online','guest') NOT NULL DEFAULT 'guest',
    address         VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE customer_reviews (
    review_id       INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    variant_id      INT NOT NULL,
    order_id        BIGINT NULL,
    rating          TINYINT NOT NULL COMMENT '1-5',
    comment         TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 2 & 3: GIỎ HÀNG / WISHLIST (Online) - không áp dụng cho POS
-- ============================================================================

CREATE TABLE carts (
    cart_id         INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    cart_item_id    INT AUTO_INCREMENT PRIMARY KEY,
    cart_id         INT NOT NULL,
    variant_id      INT NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    UNIQUE KEY uq_cart_variant (cart_id, variant_id)
) ENGINE=InnoDB;

CREATE TABLE wishlists (
    wishlist_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    variant_id      INT NOT NULL,
    added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    UNIQUE KEY uq_wishlist (customer_id, variant_id)
) ENGINE=InnoDB;

-- ============================================================================
-- KHUYẾN MÃI / VOUCHER (dùng chung Online + POS)
-- ============================================================================

CREATE TABLE promotions (
    promotion_id    INT AUTO_INCREMENT PRIMARY KEY,
    promo_code      VARCHAR(50) NOT NULL UNIQUE,
    promo_name      VARCHAR(150) NOT NULL,
    discount_type   ENUM('percent','amount') NOT NULL,
    discount_value  DECIMAL(12,2) NOT NULL,
    channel_scope   ENUM('online','pos','both') NOT NULL DEFAULT 'both',
    start_date      DATETIME NOT NULL,
    end_date        DATETIME NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 2, 3, 4: ĐƠN HÀNG (dùng chung Online & POS qua trường "channel")
-- ============================================================================

CREATE TABLE orders (
    order_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code      VARCHAR(30) NOT NULL UNIQUE,
    channel         ENUM('online','pos') NOT NULL,
    customer_id     INT NULL COMMENT 'NULL nếu khách vãng lai không lưu tài khoản',
    branch_id       INT NULL COMMENT 'Bắt buộc nếu channel = pos',
    staff_id        INT NULL COMMENT 'NV bán tại quầy, NULL nếu đơn online tự đặt',
    order_status    ENUM('pending','confirmed','processing','shipping',
                          'completed','cancelled','returned') NOT NULL DEFAULT 'pending',
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_address VARCHAR(255) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (staff_id) REFERENCES accounts(account_id),
    INDEX idx_order_channel_status (channel, order_status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    order_item_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    variant_id      INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL COMMENT 'Giá tại thời điểm bán (snapshot)',
    line_discount   DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
) ENGINE=InnoDB;

-- Quan hệ N-N đơn hàng - khuyến mãi (1 đơn có thể áp nhiều voucher)
CREATE TABLE order_promotions (
    order_id        BIGINT NOT NULL,
    promotion_id    INT NOT NULL,
    discount_applied DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (order_id, promotion_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id)
) ENGINE=InnoDB;

-- Lịch sử trạng thái đơn hàng (audit trail, phục vụ realtime notify + báo cáo)
CREATE TABLE order_status_history (
    history_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    status          VARCHAR(30) NOT NULL,
    changed_by      INT NULL COMMENT 'account_id thực hiện thay đổi',
    changed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note            VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES accounts(account_id)
) ENGINE=InnoDB;

-- Trả hàng / đổi hàng
CREATE TABLE order_returns (
    return_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    return_type     ENUM('return','exchange') NOT NULL,
    reason          VARCHAR(255),
    status          ENUM('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
    processed_by    INT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES accounts(account_id)
) ENGINE=InnoDB;

CREATE TABLE order_return_items (
    return_item_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_id       BIGINT NOT NULL,
    order_item_id   BIGINT NOT NULL,
    quantity        INT NOT NULL,
    exchange_variant_id INT NULL COMMENT 'Biến thể đổi sang (nếu là exchange)',
    FOREIGN KEY (return_id) REFERENCES order_returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
    FOREIGN KEY (exchange_variant_id) REFERENCES product_variants(variant_id)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 5: THANH TOÁN (API ngoài: VNPay/Momo cho online, QR/tiền mặt tại quầy)
-- ============================================================================

CREATE TABLE payments (
    payment_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    payment_method  ENUM('vnpay','momo','cash','qr_pos','bank_transfer') NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    transaction_code VARCHAR(100) NULL COMMENT 'Mã giao dịch trả về từ cổng thanh toán',
    payment_status  ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at         DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment_refunds (
    refund_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id      BIGINT NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    reason          VARCHAR(255),
    status          ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending',
    processed_by    INT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES accounts(account_id)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 6: REALTIME & CHATBOT HỖ TRỢ
-- ============================================================================

CREATE TABLE faqs (
    faq_id          INT AUTO_INCREMENT PRIMARY KEY,
    question        VARCHAR(500) NOT NULL,
    answer          TEXT NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE chat_conversations (
    conversation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NULL,
    staff_id        INT NULL COMMENT 'NULL nếu đang chat với chatbot',
    conversation_type ENUM('bot','human') NOT NULL DEFAULT 'bot',
    started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at        DATETIME NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (staff_id) REFERENCES accounts(account_id)
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
    message_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type     ENUM('customer','staff','bot') NOT NULL,
    message_content TEXT NOT NULL,
    sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Thông báo realtime (đơn hàng mới, cập nhật trạng thái...) qua Socket.io
CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_type  ENUM('customer','account') NOT NULL,
    recipient_id    INT NOT NULL COMMENT 'customer_id hoặc account_id tùy recipient_type',
    notif_type      VARCHAR(50) NOT NULL COMMENT 'NEW_ORDER, ORDER_STATUS_UPDATE, CHAT_MESSAGE...',
    content         VARCHAR(500) NOT NULL,
    related_order_id BIGINT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (related_order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- MODULE 9: THỐNG KÊ & BÁO CÁO
-- Không tạo bảng riêng (tránh dư thừa dữ liệu / vi phạm chuẩn hóa).
-- Thay vào đó dùng VIEW để tổng hợp real-time từ dữ liệu gốc.
-- ============================================================================

-- 9.1 Doanh thu theo kênh (Online vs POS)
CREATE OR REPLACE VIEW vw_revenue_by_channel AS
SELECT
    o.channel,
    DATE(o.created_at) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_revenue
FROM orders o
WHERE o.order_status = 'completed'
GROUP BY o.channel, DATE(o.created_at);

-- 9.2 Sản phẩm bán chạy theo kênh
CREATE OR REPLACE VIEW vw_best_selling_products AS
SELECT
    o.channel,
    p.product_id,
    p.product_name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.unit_price - oi.line_discount) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN product_variants pv ON oi.variant_id = pv.variant_id
JOIN products p ON pv.product_id = p.product_id
WHERE o.order_status = 'completed'
GROUP BY o.channel, p.product_id, p.product_name;

-- 9.3 Thống kê tồn kho
CREATE OR REPLACE VIEW vw_inventory_summary AS
SELECT
    p.product_id,
    p.product_name,
    b.branch_id,
    b.branch_name,
    SUM(i.quantity) AS total_stock
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.variant_id
JOIN products p ON pv.product_id = p.product_id
JOIN branches b ON i.branch_id = b.branch_id
GROUP BY p.product_id, p.product_name, b.branch_id, b.branch_name;

-- 9.4 Thống kê khách hàng (số đơn, tổng chi tiêu)
CREATE OR REPLACE VIEW vw_customer_stats AS
SELECT
    c.customer_id,
    c.full_name,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent,
    MAX(o.created_at) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status = 'completed'
GROUP BY c.customer_id, c.full_name;