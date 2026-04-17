-- ============================================================
-- ScholarKit v2 Migration — Part 1 of 2
-- Run this with DBeaver delimiter set to ; (the default)
-- ============================================================

-- 1. DISCOUNT MANAGEMENT
ALTER TABLE products
  ADD COLUMN discount_percent INT NOT NULL DEFAULT 0;

UPDATE products SET discount_percent = 15 WHERE id IN (1, 17, 33);
UPDATE products SET discount_percent = 10 WHERE id IN (14, 30, 46);

-- 2. PERSONALIZED RECOMMENDATIONS VIEW
CREATE OR REPLACE VIEW vw_user_recommendations AS
SELECT
  u.id                   AS user_id,
  p.id                   AS product_id,
  p.name                 AS product_name,
  p.price                AS product_price,
  p.category             AS product_category,
  p.stock                AS product_stock,
  p.discount_percent     AS product_discount,
  s.name                 AS school_name,
  s.id                   AS school_id
FROM users u
JOIN (
    SELECT DISTINCT o.user_id, p2.school_id
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p2    ON p2.id = oi.product_id
) user_schools ON user_schools.user_id = u.id
JOIN products p ON p.school_id = user_schools.school_id
JOIN schools  s ON s.id = p.school_id
WHERE p.id NOT IN (
    SELECT oi2.product_id
    FROM orders o2
    JOIN order_items oi2 ON oi2.order_id = o2.id
    WHERE o2.user_id = u.id
)
AND p.stock > 0;

-- 3. SHIPPING COLUMNS
ALTER TABLE orders
  ADD COLUMN shipping_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN tracking_number  VARCHAR(100)  DEFAULT NULL;
